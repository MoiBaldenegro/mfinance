# Informe de implementación — Feature 6: registro-mensual

> Fecha: 2026-08-21 · Estado al cierre del ciclo: `in_progress`, pendiente de
> review. Suite node:test **95/95**, cargo test **61/0**, `./init.sh`
> **VERDE TOTAL** (INIT_EXIT=0), audit-design-tokens ✔.

## 1. Alcance ejecutado

Sección Registro pasa de placeholder a formulario mensual completo
(REQ-06-01…08): selector de mes con ‹ ›, dos tarjetas Ingresos|Gastos que
apilan en estrecho, campos step 0.01 con sufijo €, subtotales EN VIVO por
tarjeta, fila de totales + utilidad del mes, validación inline en rojo junto
al campo afectado y botón Confirmar que persiste vía caso de uso → puerto →
adapter IPC → `save_state` del backend.

## 2. Ciclo rojo → verde (evidencia)

### ROJO (antes de escribir código de producción)

Tests escritos PRIMERO (6 archivos, patrón F5: node:test + type-stripping de
Node v22.22.2 con extensiones `.ts` explícitas). Ejecución sobre el árbol sin
implementar:

```
$ node --test tests/frontend-shell/registro-{totales,validaciones,upsert,guardado,meses}.test.mjs
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\domain\use-cases\guardar-registro.ts'
  imported from ...tests\frontend-shell\registro-guardado.test.mjs
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '...\src\domain\use-cases\navegacion-meses.ts'
  imported from ...tests\frontend-shell\registro-meses.test.mjs
... (15 ERR_MODULE_NOT_FOUND en total)
# pass 0   # fail 5   EXIT=1
```

Salida completa guardada durante el ciclo en `$TEMP/f6-rojo.txt`; extracto
reproducible hoy: mover temporalmente los módulos nuevos fuera de `src/`
(p. ej. `mv src/domain/use-cases/guardar-registro.ts "$TEMP/"`, ídem
importe-errors/validacion-importes/totales-registro/upsert-registro/
navegacion-meses/textos-registro) y repetir el comando anterior → vuelve el
mismo ROJO; restaurar los archivos a su ruta original devuelve el verde.
(El workspace NO es repositorio git: no hay `git stash` posible.)

### Corrección intermedia documentada

Con la primera implementación, `numeroSeguro('-5')` devolvía 0 (delegaba en
`parsearImporte`, que lanza). El test definió el contrato correcto: la vista
previa EN VIVO mantiene negativos visibles; el BLOQUEO ocurre solo al guardar
(`validarCamposImporte`). Se corrigió la implementación, no el test:
`Expected 0 !== -5` → verde.

### VERDE final

```
$ pnpm test
# tests 95   # suites 22   # pass 95   # fail 0   (53 previas + 42 nuevas)
$ cargo test --manifest-path src-tauri/Cargo.toml
test result: ok. 61 passed; 0 failed
$ ./init.sh
✔ formato … ✔ tests al 100% … ✔ build de producción … INIT_EXIT=0
✔ AUDIT ningún color fuera de tokens.css en src/styles
```

Correcciones de compilación del ciclo (tsc estricto): tipo de retorno de
`camposDelBorrador` era `CampoImporte[]` (no `ErrorCampo[]`) y residuo de una
edición en `validacion-importes.ts` eliminado. Ningún test fue debilitado.

## 3. Árbol tocado (líneas)

Nuevos — dominio front (puro, sin React ni IPC):

| Archivo | Líneas | Rol |
|---|---|---|
| `src/domain/errors/importe-errors.ts` | 26 | `ImporteNoNumericoError` / `ImporteNegativoError` nombrados ES |
| `src/domain/use-cases/validacion-importes.ts` | 80 | parsearImporte, numeroSeguro, validarCamposImporte, erroresPorClave, avisoGlobal |
| `src/domain/use-cases/totales-registro.ts` | 22 | totalesDeRegistro {ingresos, gastos, utilidad} |
| `src/domain/use-cases/upsert-registro.ts` | 46 | upsertRegistroMes (crear/actualizar + orden) y buscarRegistroMes |
| `src/domain/use-cases/navegacion-meses.ts` | 30 | mesAnterior/mesSiguiente (cruce de año) y mesActualDesde |
| `src/domain/use-cases/guardar-registro.ts` | 99 | caso de uso de guardado: valida → construye → upsert → port.save |
| `src/domain/use-cases/textos-registro.ts` | 34 | mapeo montos ⇄ textos de inputs (abrir a ceros) |

Nuevos — UI y estilos:

| Archivo | Líneas |
|---|---|
| `src/components/registro-section/MonthSelector.tsx` | 45 |
| `src/components/registro-section/CampoImporte.tsx` | 59 |
| `src/components/registro-section/TarjetaMontos.tsx` | 56 |
| `src/components/registro-section/use-registro-mensual.ts` | 100 |
| `src/styles/month-selector.css` | 32 |
| `src/styles/campo-importe.css` | 46 |
| `src/styles/tarjeta-montos.css` | 35 |

Modificados:

| Archivo | Líneas | Cambio |
|---|---|---|
| `src/components/registro-section/RegistroSection.tsx` | 75 | placeholder → formulario completo |
| `src/styles/registro-section.css` | 65 | layout 2 columnas + apilado @720px, pie y botón |
| `src/components/shell/SnapshotProvider.tsx` | 73→82 | añade `aplicarSnapshot(snapshot)` al contexto |

Nuevos — tests (node:test, stdlib):

| Archivo | Líneas |
|---|---|
| `tests/frontend-shell/registro-totales.test.mjs` | 68 |
| `tests/frontend-shell/registro-validaciones.test.mjs` | 96 |
| `tests/frontend-shell/registro-upsert.test.mjs` | 91 |
| `tests/frontend-shell/registro-guardado.test.mjs` | 65 |
| `tests/frontend-shell/registro-bloqueos.test.mjs` | 85 |
| `tests/frontend-shell/registro-meses.test.mjs` | 46 |
| `tests/frontend-shell/helpers-registro.mjs` (no descubierto) | 41 |

**Máximo del ciclo: 100 líneas** (`use-registro-mensual.ts`) ≤ 100. Los dos
archivos que excedieron durante el ciclo (hook 126, registro-guardado.test
127) se dividieron temáticamente como en F5 ronda 2.

## 4. Decisiones

- **Backend NO modificado.** `save_state` (application/) ya persiste cualquier
  `FinanceSnapshot` válido vía el trait-puerto; el upsert es lógica de
  composición del agregado que pertenece al cliente del snapshot. El esquema
  serde existente (`MonthlyRecord` con `BTreeMap<IncomeSource,f64>` etc.)
  acepta tal cual los objetos parciales que envía el adapter IPC (hallazgo de
  F5: enums serializan por nombre de variante). Validación dura de importes se
  aplica ANTES de llamar al puerto; además `upsertRegistroMes` revalida
  invariantes (defensa en profundidad). Cero cambios en Cargo.toml.
- **Persistencia tras confirmar:** `guardarRegistroMes` devuelve el snapshot
  nuevo resultante del upsert; el hook lo publica vía `aplicarSnapshot` del
  SnapshotProvider, así toda la app (cabecera, resúmenes, P&G futuro) ve el
  estado persistido sin segunda pasada de carga. REQ-06-04 «tras recargar»
  queda cubierto porque lo publicado ES lo enviado a `save_state`.
- **Concurrencia simple:** bandera `ocupado` deshabilita Confirmar mientras el
  `await port.save` está en curso (REQ-06-07) y muestra "Guardando…"; un
  segundo clic es no-op. No hay guardados simultáneos posibles desde esta UI;
  el último guardado gana en el backend (escritura atómica tmp+rename de F4).
- **Apertura a ceros (REQ-06-08):** al cambiar de mes el hook reconstruye los
  textos desde el registro persistido o deja '' (=0) si no existe; nunca arrastra
  datos de otros meses. El mes inicial es el mes de trabajo (último registrado)
  o el mes calendario si aún no hay registros.
- **Subtotales EN VIVO (REQ-06-05):** `numeroSeguro` suma lo tecleado sin
  lanzar (inválido = 0, negativo visible); los errores nombrados solo actúan
  al confirmar, junto al campo afectado (`--color-negative`, REQ-06-06).
- **Accesibilidad básica:** labels asociados por id, `aria-label` en flechas y
  campo month, `aria-invalid` + `aria-describedby` en campo inválido,
  `role="alert"` para errores, fieldset/legend para las tarjetas, foco nativo
  en inputs; ‹ › son `<button>` reales.
- **Solo tokens.css (ronda 2):** colores/espaciados/radios/sombras siempre
  vía var(); tipografía SIEMPRE heredada (`font: inherit`), sin tamaños
  propios — tokens.css no define escala tipográfica y design.md prohíbe
  ampliarlo sin discusión registrada. Ancho del input de importe derivado de
  la escala existente: `width: calc(var(--space-8) * 2)` (=2×64px).
- **Criterio único para los 6 bordes `1px solid` (ronda 2), por rol:**
  (1) *superficies* (fieldset tarjeta-montos) → SIN borde, las delimita
  `--shadow-card` igual que todas las secciones F5; (2) *divisores*
  (subtotal de tarjeta y pie de sección) → banda `var(--space-1) solid
  var(--color-bg)`, técnica exacta de section-tabs.css:10 aprobada en F5;
  los botones ‹ › pasan a `border:none` con hover, como las pestañas;
  (3) *contorno funcional de controles de edición* (input de importe e input
  type=month, 2 ocurrencias) → **hairline registrado como excepción
  explícita** junto al breakpoint: tokens.css no define grosores de trazo y
  ninguna alternativa del sistema (sombra, banda de espaciado o relleno)
  comunica editabilidad en un campo numérico; engrosarlo a `--space-1`
  (4px) deformaría el control y dividirlo sería un truco semántico.
- **Breakpoint 720px:** sigue registrado como excepción (no es valor del
  sistema color/espacio/radio/sombra/tipografía).

## 5. Verificación final (re-ejecutada tras la ronda 2)

| Check | Resultado |
|---|---|
| `pnpm test` (node:test) | 95/95 pass (53 previas intactas + 42 nuevas; ninguna debilitada) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | 61 passed / 0 failed |
| `./init.sh` | VERDE TOTAL, INIT_EXIT=0 |
| `node scripts/audit-design-tokens.mjs` | ✔ |
| `grep invoke( fuera de src/adapters/` | 0 |
| `grep react|@tauri-apps en src/domain/` | 0 |
| grep hex/rgb/px/rem fuera de tokens.css | SOLO excepciones registradas §4: hairline ×2 (campo-importe.css:29, month-selector.css:30) + breakpoint 720px (registro-section.css:29) |
| `wc -l` máx. archivo nuevo/modificado | 100 ≤ 100 |
| Dependencias nuevas npm/crates | 0 |

### Ronda 2 (CHANGES_REQUESTED de review_6.md — aplicada)

1. ✔ `font-size: 0.925rem/0.85rem` eliminados de campo-importe.css
   (tipografía heredada; sin ampliar tokens.css).
2. ✔ `width: 7.5rem` → `calc(var(--space-8) * 2)` (escala existente,
   patrón month-selector.css:9).
3. ✔ Bordes normalizados con un criterio por rol: fieldset→sombra sin
   borde, divisores→banda `--space-1/--color-bg` (técnica section-tabs),
   botones ‹ ›→sin borde; hairline de los 2 controles de edición
   registrado como excepción explícita en §4 junto al breakpoint.
4. ✔ impl_6.md: añadido registro-meses.test.mjs (46 líneas) a §3 y
   sustituida la referencia a git (workspace sin repo) por el
   procedimiento real de reproducción del ROJO.
5. ✔ Suites re-verificadas en verde (tabla superior).
