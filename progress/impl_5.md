# Informe de implementación — Feature 5: shell-frontend

Fecha: 2026-08-21 · Agente: implementador (sin subagentes, el reviewer lo
lanza el líder) · Entorno: Windows + Git Bash, Node v22.22.2.

## 1. Alcance cumplido

Esqueleto navegable de mfinance en español: tipos/puertos TS espejo del
dominio Rust en `src/domain/`, único adapter Tauri IPC con `invoke()`,
casos de uso front, contexto React mínimo, shell con cabecera fija,
pestañas horizontales scrollables, DIEZ secciones placeholder (REQ-05-04
manda sobre design.md: Registro PyG Balance Deuda Inversiones Indicadores
Conciliación Cierre Diagnóstico Ajustes), `tokens.css` completo y carga
IPC al arrancar con error nombrado + Reintentar (REQ-05-07).

## 2. Experimento type-stripping (Node v22.22.2)

Comando ejecutado:
`node -e "import(pathToFileURL($TEMP+'/probe-types.ts').href).then(...)"`.

Resultado: **SÍ importa .ts directamente** (type stripping habilitado por
defecto desde Node ≥22.18). Salida observada:
`TYPE-STRIP OK: [ 'FUENTES', 'dobla' ] 42`.
Notas prácticas descubiertas:
- Un import dinámico con path absoluto de Windows falla si no se convierte
  a URL `file://` (`pathToFileURL`); los imports relativos estáticos van bien.
- Solo sintaxis borrable (erasable): sin enums TS, sin parameter
  properties; extensiones `.ts` explícitas en imports relativos.
- Consecuencia: la suite node:test prueba la LÓGICA REAL de los módulos TS
  puros (catálogos, month-key, errores, caso de uso de carga con puerto
  fake, resúmenes y array declarativo de navegación), no solo estructura.

## 3. Hallazgo serde (decisión clave de espejo)

Proyecto scratch FUERA del repo (en `$TEMP/probe-serde`, no se tocó
`src-tauri/**`) replicando los derives exactos de catalogs.rs/snapshot.rs:

```json
{ "gastos": { "CuotasDeuda": 364.0 },
  "ingresos": { "Arriendos": 650.0, "Salario": 2450.0 },
  "strategy": { "debt_strategy": "Avalanche", ... } }
```

**Los enums unit serializan con el nombre de variante Rust** ("Salario",
"CuotasDeuda", "Avalanche"), NO con la clave canónica minúscula de
`as_str()`. Por eso las uniones literales usan los valores de cable reales
(`type IncomeSource = 'Salario' | 'Freelance' | 'Arriendos' | 'Otros'`),
imprescindible para leer datos vivos por IPC, y las claves canónicas
exactas del REQ quedan expuestas como catálogo derivado alineado:
`CANONICAL_INCOME_KEYS = ['salario','freelance','arriendos','otros']` y
`CANONICAL_EXPENSE_KEYS = ['vivienda','alimentacion','transporte',
'cuotas_deuda','ocio','otros']`, con etiquetas en español para la UI.
Ambas listas están verificadas por test contra el orden exacto.

## 4. Ciclo ROJO → VERDE

ROJO (guardado en `$TEMP/rojo_f5.txt`; resumen):
```
not ok REQ-05-02 invoke() solo adapters   (App.tsx scaffold usa invoke)
not ok REQ-05-06 sin CSS embebido         (App.tsx importa ./App.css)
not ok REQ-05-05 tokens.css completo      (ENOENT src/styles/tokens.css)
Error [ERR_MODULE_NOT_FOUND]: ...secciones.ts imported from frontend-shell.test.mjs
# tests 5  # pass 1  # fail 4
```
El único pase era vacuo (REQ-05-01 itera un src/domain inexistente) y se
endureció añadiendo aserción de existencia de los 7 archivos núcleo.

VERDE final:
- Suite nueva frontend-shell (dividida en ronda 2 en
  `tests/frontend-shell/`): 26/26 aserciones — secciones-catalogos.test.mjs
  (6), month-key-errores-carga.test.mjs (7) y resumenes.test.mjs (13),
  con helpers.mjs compartido (fixture + puerto falso + títulos del REQ).
  Cubre: diez secciones en orden exacto del REQ, catálogos cable+canónicos,
  month-key, errores nombrados, cargarSnapshot con puerto fake
  ok/rechazo IPC/fallo inesperado, once resúmenes con números exactos,
  snapshot vacío.
- Suite nueva frontend-hexágono (dividida en ronda 2 en
  `tests/frontend-hexagono/`): 6/6 — nucleo.test.mjs (REQ-05-01/02) y
  ui.test.mjs (REQ-05-05 tokens / REQ-05-06 CSS), con utils.mjs compartido;
  greps ejecutables sobre el árbol real.
- Total `node --test`: **53/53** (21 previas + 32 nuevas; tras la división
  de ronda 2 el nº de aserciones es IDÉNTICO: ninguna eliminada ni
  debilitada).
- `pnpm build` (tsc estricto + vite): verde. `cargo test`: **61/61**;
  `cargo check`: limpio. `node scripts/audit-design-tokens.mjs`: ✔.
- `./init.sh`: **verde total, INIT_EXIT=0** (re-verificado en ronda 2).

## 5. Árbol nuevo/modificado (líneas; máx. del ciclo 96 ≤ 100)

```
NUEVOS  src/domain/
  entities/catalogs.ts(79) entities/month-key.ts(41) entities/monthly-record.ts(26)
  entities/asset.ts(7) entities/liability.ts(8) entities/investment.ts(10)
  entities/account-statement.ts(36) entities/strategy-settings.ts(14)
  entities/finance-snapshot.ts(28)
  errors/snapshot-errors.ts(73) ports/snapshot-port.ts(15)
  use-cases/load-snapshot.ts(40) use-cases/resumenes-flujo.ts(68)
  use-cases/resumenes-patrimonio.ts(65) use-cases/resumenes-secciones.ts(42)
NUEVOS  src/adapters/
  snapshot-ipc-adapter.ts(48)          ← ÚNICO sitio con invoke()
NUEVOS  src/components/
  shell/secciones.ts(33) shell/SnapshotProvider.tsx(73) shell/AppShell.tsx(52)
  shell/HeaderBar.tsx(19) shell/SectionTabs.tsx(35)
  error-screen/ErrorScreen.tsx(26)
  <10 ×> {registro,pyg,balance,deuda,inversiones,indicadores,
        conciliacion,cierre,diagnostico,ajustes}-section/XxxSection.tsx(21 c/u)
NUEVOS  src/styles/  tokens.css(38) global.css(21) app-shell.css(12)
  header-bar.css(19) section-tabs.css(29) error-screen.css(28) app.css(13)
  <10 hojas propias de sección>(18 c/u)
NUEVOS  tests/frontend-shell/
  helpers.mjs(90) secciones-catalogos.test.mjs(67)
  month-key-errores-carga.test.mjs(87) resumenes.test.mjs(96)
NUEVOS  tests/frontend-hexagono/
  utils.mjs(31) nucleo.test.mjs(62) ui.test.mjs(69)
MODIFICADOS  src/App.tsx(51→34) src/main.tsx(9→10) index.html(lang es+título)
ELIMINADOS  src/App.css y src/assets/react.svg (scaffold);
  en ronda 2: tests/frontend-shell.test.mjs(305) y
  tests/frontend-hexagono.test.mjs(131), sustituidos por los 5 .test.mjs +
  2 helpers de arriba (mismas 32 aserciones)

### Nota de corrección (ronda 2, review_5.md CHANGES_REQUESTED)

La métrica original de esta sección («máx. 79 ≤ 100») contaba solo `src/`
y era incompleta: los dos archivos de test nuevos excedían el límite
(frontend-shell.test.mjs 305; frontend-hexagono.test.mjs 131). Aplicada la
división temática exigida, la métrica correcta sobre TODO archivo
nuevo/modificado del ciclo (tests incluidos) es **máx. 96**
(tests/frontend-shell/resumenes.test.mjs) ≤ 100; máximo en `src/` sigue
siendo 79 (entities/catalogs.ts). Verificado con `wc -l`.

## 6. Decisiones

- **Mapping tipos↔commands**: `load_state/save_state/export_json/import_json`
  (firmas reales de snapshot_commands.rs) ↔ operaciones tipadas del puerto
  `SnapshotPort` (load/save/export/import). El rechazo del backend llega
  como `CommandError { codigo, mensaje }`; el adapter lo reconstruye en la
  clase TS homónima (`errorDesdeCodigoIpc`), conservando nombre y motivo en
  español. Tauri v2 hace camelCase JS↔snake_case Rust de argumentos.
- **Contexto React mínimo**: `SnapshotProvider` inyecta el adapter al caso
  de uso `cargarSnapshot` y publica `{nombre: cargando|listo|error} +
  recargar()`; App conmuta pantallas; Reintentar incrementa `intento`,
  relanzando el efecto (REQ-05-07). Es glue sin marcado propio: única
  excepción documentada a la regla de hoja CSS propia.
- **Resúmenes por sección** como casos de uso puros (flujo/patrimonio +
  despachador): los placeholders delegan y quedan testeables sin React.
  Formato euros es-ES determinista (1.576,00 €) sin depender de ICU.
- **Navegación declarativa** `SECCIONES` (id kebab + título español),
  derivada en pestañas scrollables; sin router externo (design.md).
- **Tokens**: todos los valores visuales salen de custom properties; los
  semánticos positive/warn/negative quedan reservados para F10.
- **Alcance estricto**: cero cambios en src-tauri/**, scripts/, specs/,
  docs/, templates/, Cargo.toml; cero dependencias npm nuevas (Chart.js
  llega en F7 con su alta aprobada).

## 7. Verificación visual

No se lanzó pnpm dev/tauri dev (procesos largos que bloquean); la
comprobación visual completa corresponde al humano. Todo lo automatizable
está en verde: node --test 53/53, tsc+vite build, cargo check/test 61/61,
audit-design-tokens, ./init.sh INIT_EXIT=0.
