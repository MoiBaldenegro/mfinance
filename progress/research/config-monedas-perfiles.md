# Análisis — Configuración de entrada: moneda, configurables y perfiles

> Informe de spec_author (2026-08-22). Problema del humano (traducido):
> "mejorar toda la parte de configuración de entrada, seleccionar diferentes
> monedas — euros está bien pero necesitamos dólares y pesos mexicanos, y que
> esté en pesos mexicanos por defecto ya que es el principal target. Haz un
> análisis para ver todo lo que podamos poner configurable, porque necesitamos
> perfiles también, saber de quién es la información que estamos viendo."

## 1. Reafirmación del problema y alcance

1. **Moneda configurable** entre MXN, USD y EUR con **MXN por defecto**
   (target principal México). Hoy el 100% del formateo está hardcodeado a
   es-ES + €.
2. **Catálogo razonado de configurables**: el humano quiere una propuesta
   fundamentada de qué más puede ser configurable (sección 6), no solo lo
   obvio.
3. **Perfiles multiperfil**: saber de quién son los datos visualizados
   (selector, datos aislados por titular).

Fuera de alcance explícito: conversión entre monedas con tipos de cambio
(exigiría API externa o dependencias nuevas, no aprobadas), eliminación de
perfiles, i18n de la interfaz.

## 2. Estado verificado del formateo hardcodeado

Puntos exactos localizados (base de la migración de la feature 20):

| Archivo | Qué hay |
|---------|---------|
| `src/domain/use-cases/resumenes-flujo.ts` | `formatoEuros()` determinista manual "1.576,00 €" (sin ICU). Es EL formateador central: lo importan directamente `balance-*`, `deuda-tabla.ts`, `simulador-comparativa.ts`, `resumenes-patrimonio.ts` y vía `resumenes-secciones.ts` media UI (Registro, Cierre, PyG…). |
| `src/domain/use-cases/conciliacion-logic.ts` | `formatearEuros()` con `Intl.NumberFormat('es-ES', EUR)`. |
| `src/domain/use-cases/inversiones-proyeccion.ts` | `formatearEuros()` sin decimales con `toLocaleString('es-ES') + ' €'`. |
| `src/components/pyg-proyeccion-section/GraficaProyeccion.tsx` | Literal inline `${Number(value).toLocaleString('es-ES')} €`. |
| Etiquetas y sufijos | `CampoImporte.tsx` sufijo `€`; cabeceras "Importe (€)" (`DiagnosticoTabla.tsx`), "(€)" en `TablaInversiones`, `ActivoForm`, `PasivoForm`; aria-labels "en euros". |
| Textos | `simulador-validaciones.ts`: "mayor que cero euros"; comentarios varios. |

Conclusión: existe UN punto de convergencia (`formatoEuros`) más DOS
formateadores divergentes y un literal suelto. La migración es mecánica si se
crea antes el núcleo común.

## 3. Decisión 1 — Dónde vive la moneda: StrategySettings del snapshot (NO localStorage)

**Decisión: la moneda vive en `StrategySettings` dentro de `FinanceSnapshot`,
con valor por defecto MXN vía serde default. No sigue el patrón TemaPort.**

Razonamiento:

- El tema (feature 17) vive FUERA del snapshot porque es una preferencia de
  presentación de la máquina: oscuro/claro no depende de cuyos son los datos.
- La moneda ES un atributo de los datos financieros del titular: si mañana
  conviven perfiles (Ana en MXN, Beto en EUR) en la misma máquina, cada uno
  quiere SU moneda. Al vivir en el snapshot:
  - cada perfil tendrá automáticamente su propia moneda cuando la feature 21
    aísle snapshots por perfil → **cero repintado posterior** (el orden 19→20
    →21→22 evita pintar dos veces);
  - export/import llevan la moneda dentro del archivo ("este JSON está en
    pesos"), coherente con el significado de los importes;
  - persiste por el camino YA existente (`save_state`), sin commands nuevos.
- Contra-argumento descartado (localStorage como tema): obligaría a re-keyear
  la preferencia por perfil-id cuando lleguen los perfiles, y un snapshot
  importado perdería la moneda de origen.

**Cambio de esquema mínimo**: nuevo campo `currency` en `StrategySettings`
(`src-tauri/src/domain/snapshot.rs`, hoy 77 líneas; si supera 100, el enum va
a `domain/currency.rs`). `#[serde(default)]` → cualquier `mfinance.json`
antiguo deserializa a MXN sin migración activa. Espejo TS en
`src/domain/entities/strategy-settings.ts` (`AJUSTES_POR_DEFECTO.currency =
'MXN'`).

**Semántica documentada: cambiar de moneda RE-ETIQUETA la visualización, no
convierte importes** (no hay tipos de cambio ni red ni dependencias). Los
importes históricos son números unitarios; el símbolo es presentación.

## 4. Decisión 2 — Cómo se formatea: núcleo puro determinista multi-moneda

- Nuevo módulo único `src/domain/use-cases/formato-moneda.ts` +
  entidad-catálogo `src/domain/entities/moneda.ts`:

| Moneda | Símbolo | Miles | Decimal | Posición | Ejemplo 1576000.5 |
|--------|---------|-------|---------|----------|-------------------|
| MXN    | `$`     | `,`   | `.`     | antes    | `$1,576,000.50`   |
| USD    | `$`     | `,`   | `.`     | antes    | `$1,576,000.50`   |
| EUR    | `€`     | `.`   | `,`     | después  | `1.576.000,50 €`  |

- Firma: `formatoMoneda(valor: number, moneda: Moneda, decimales = 2)`.
  Determinista manual (mismo espíritu que el actual `formatoEuros`, que ya
  evitó Intl por estabilidad de tests entre entornos/ICU). El caso "sin
  decimales" de inversiones usa `decimales = 0`.
- Negativos con signo inicial, igual que hoy: `-$1,576.00` / `-1.576,00 €`.
- IF moneda fuera del catálogo THEN error nombrado del dominio
  (`src/domain/errors/`), nunca cadena silenciosa.
- Sin dependencias nuevas: `Intl.NumberFormat` nativo cubriría MXN/USD/EUR,
  pero se descarta como motor por la varianza ICU (precedente del comentario
  existente "sin depender de ICU"); queda prohibida cualquier librería.

## 5. Decisión 3 — Modelo de perfiles y aislamiento

### 5.1 Layout de almacenamiento (Documents/mfinance)

```
Documents/mfinance/
├── profiles.json                    # registro: { activa: id|null, perfiles: [Perfil] }
├── mfinance.json                    # LEGADO pre-perfiles (tras migrar: backup)
├── mfinance.pre-perfiles.json       # copia de seguridad de la migración única
├── comprobantes/<perfilId>/<YYYY-MM>/...
└── perfiles/
    └── <perfilId>/mfinance.json     # FinanceSnapshot COMPLETO del perfil
```

- Entidad `Perfil { id, nombre, creado_en }` en `domain/perfil.rs` + trait
  puerto `PerfilRepository`; adapter `infrastructure/perfil_repository_json.rs`.
- Ids únicos SIN crate nueva (uuid no aprobada): generado en Rust stdlib
  (p. ej. nanos de `SystemTime` → `p_<hex>`); test de unicidad.
- `JsonSnapshotRepository` pasa a resolver la ruta del estado según el perfil
  activo (inyección de resolución de ruta o adapter envolvente): los commands
  `load_state/save_state/export_json/import_json` NO cambian de firma y pasan
  a operar sobre el snapshot del perfil activo.
- Commands nuevos finos: `listar_perfiles`, `crear_perfil(nombre)`,
  `seleccionar_perfil(id)`; composition root en `lib.rs` registra y mantiene
  el perfil activo en `AppState`.

### 5.2 Migración del dato legado y seed (MXN por defecto)

- Migración automática ÚNICA al arrancar: si NO existe `profiles.json` Y sí
  existe el `mfinance.json` legado → se crea el primer perfil ("Personal"),
  se escribe su snapshot en `perfiles/<id>/mfinance.json`, el legado se renombra
  a `mfinance.pre-perfiles.json` (backup) y queda fuera del camino de carga.
  Si `profiles.json` ya existe, la migración no se repite (test).
- Seed: si no existen perfiles, se crea el perfil inicial sembrado igual que
  hoy (`ensure_seed`, guard de existencia por ruta de perfil).
- El JSON legado no tiene campo `currency` → serde default lo carga a **MXN**.
  Aceptado y documentado: los datos previos eran ejemplo/seed en euros y el
  humano fija MXN como defecto del target; no hay conversión de importes.
- Comprobantes PDF también quedan aislados por perfil (ruta incluye `<perfilId>`).

## 6. Catálogo razonado de configurables (lo que pediste analizar)

### 6.1 Ya configurables hoy (estado real)

| # | Configurable | Dónde vive hoy | Fuera/dentro snapshot |
|---|--------------|----------------|----------------------|
| 1 | Tema oscuro/claro | TemaPort + localStorage (f17) | Fuera (presentación de máquina) |
| 2 | Estrategia de deuda avalancha/bola | `StrategySettings.debt_strategy` | Dentro |
| 3 | Pago extra mensual | `StrategySettings.extra_monthly_payment` | Dentro |
| 4 | Tasa esperada por familia de inversión | `Investment.tasa_esperada` editable | Dentro |
| 5 | Supuestos % de proyección PyG | editables en UI (f14) | Efímero (no persistidos) |

### 6.2 Propuestos AHORA (este ciclo, features 19–22)

| # | Configurable | Justificación | Dónde viviría |
|---|--------------|---------------|---------------|
| 6 | **Moneda MXN/USD/EUR, defecto MXN** | Pedido explícito; target México | `StrategySettings.currency` (dentro) |
| 7 | **Nombre del titular/perfil** | "saber de quién es la información" | `profiles.json` (registro de perfiles) |

### 6.3 Propuestos FUTUROS (sin features en este ciclo; backlog futuro)

| # | Configurable | Nota de diseño | Dónde viviría |
|---|--------------|----------------|---------------|
| 8 | Locale/formato regional independiente de la moneda (fechas, separadores) | Desacoplar idioma de moneda; hoy locale = función de la moneda | Snapshot o local |
| 9 | Moneda secundaria de referencia con tipo de cambio MANUAL (sin API) | Conversión informativa; el humano introduce la tasa | Snapshot |
| 10 | Umbral del fondo de emergencia personalizable (hoy constante `FONDO_VERDE_MIN = 3.0` en `indicadores_constants.rs`) y umbrales del semáforo (15/30, 15/5, 100/25) | Familias difieren; constantes ya están centralizadas y testeables → moverlas a settings es barato | Snapshot (StrategySettings ampliado) |
| 11 | Categorías de ingreso/gasto personalizadas | Hoy catálogo cerrado en `catalogs.rs` validado con error nombrado | Snapshot |
| 12 | Presupuesto objetivo mensual global o por categoría | Complementa el presupuesto del cierre (f16) | Snapshot |
| 13 | Eliminar/renombrar perfiles, avatar/color por perfil | Requiere política de borrado seguro (backup + confirmación fuerte) | profiles.json |
| 14 | Idioma de la interfaz (i18n español/inglés) | Coste alto: todos los textos UI están en español inline | Local/recursos |
| 15 | Primer día de semana / fecha de corte mensual | Afecta agregaciones mensuales | Snapshot |
| 16 | Copias de seguridad automáticas programadas | El export/import manual ya existe | Infrastructure |

Criterio NOW vs FUTURO: ahora solo lo pedido explícitamente y lo que el orden
de features hace barato sin repintar; lo demás queda propuesto con su diseño
orientativo para que el humano decida.

## 7. Orden de dependencias (para no pintar dos veces)

```
19 modelo-moneda-nucleo        (modelo Rust + espejo TS + formateador puro, sin UI)
 ├─ 20 moneda-ui-ajustes       (selector + migración de TODOS los puntos es-ES €)
 └─ 21 perfiles-modelo-almacenamiento  (aislamiento por perfil; hereda esquema con currency)
      └─ 22 perfiles-ui-selector       (puerto+adapter IPC, gestión e indicador)
```

- 20 depende de 19: no se toca ni un formateador hasta que el núcleo tenga
  tests verdes.
- 21 depende de 19 (no de 20): el esquema de snapshot con `currency` debe
  estar cerrado para que cada archivo por-perfil lo incluya desde el día uno;
  además garantiza que la moneda quede usable ANTES que los perfiles.
- 22 depende de 21: la UI consume el modelo cerrado.
- La numeración por id ya fuerza el orden one-feature-at-a-time; las
  dependencias expresan la real (19→20, 19→21, 21→22).

## 8. Riesgos y trabas

- **100 líneas por archivo**: `snapshot.rs` está en 77 → el enum `Currency`
  puede necesitar archivo propio (`domain/currency.rs`); `formato-moneda.ts` y
  `moneda.ts` separados; `AjustesSection.tsx` crece poco pero su hoja CSS sí
  necesita entrada nueva. Ningún caso justifica `blocked`.
- **Determinismo de tests**: prohibido Intl como motor; cadenas esperadas
  fijadas en tests (rojo→verde TDD en 19, 20 y 22; cargo test en 19 y 21).
- **Sin dependencias nuevas**: ids de perfil en Rust stdlib (nada de uuid);
  nada de librerías de formato ni i18n.
- **Dominio puro**: `Currency`, `Perfil` y sus traits sin `tauri`;
  `src/domain/` TS sin react ni `@tauri-apps/api` (grep en acceptance).
- **Migración segura**: la del legado es idempotente, con backup renombrado y
  testeada en directorios temporales; jamás se pisa un archivo corrupto (guard
  del patrón `ensure_seed`).
- **Errores nombrados**: perfil inexistente, nombre vacío/duplicado,
  `profiles.json` corrupto, moneda fuera de catálogo → errores explícitos en
  ambos lados, sin fallos silenciosos.
- **Textos históricos**: los acceptance de features 1..18 mencionan "euros";
  son registro histórico y NO se reescriben; la migración cubre código y
  textos vivos de usuario.
