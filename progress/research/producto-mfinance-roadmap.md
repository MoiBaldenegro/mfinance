# Análisis de producto — mfinance roadmap completo

> Autor: spec_author. Sesión: alta en backlog del requerimiento bruto del
> humano para la herramienta de finanzas personales sobre el arnés Tauri 2 +
> React 19 ya migrado (features 1-2 done). Este documento es la fuente de
> análisis; las decisiones técnicas citadas fueron tomadas por el líder.

## 1. Reafirmación del problema

El humano pide una **app de escritorio de finanzas personales** ("mfinance")
que permita registrar mes a mes ingresos y gastos, ver automáticamente su
P&G, balance general (activos/pasivos/patrimonio), plan de salida de deuda
(avalancha/bola de nieve), indicadores con semáforo, proyección de
inversiones con interés compuesto, y un conjunto de extras (diagnóstico por
PDFs, conciliación, proyecciones modificables, simuladores, cierre mensual,
consejos). Todo en español, con datos de ejemplo realistas reemplazables,
persistencia en JSON dentro de `~/Documents/mfinance/` importable/exportable
como archivo, y gráficas con Chart.js.

**Alcance del ciclo actual**: convertir ese requerimiento bruto en features
granulares implementables (≤100 líneas por archivo) encadenadas con
`depends_on`, respetando la arquitectura hexagonal de `docs/architecture.md`.
No se implementa nada en esta sesión.

## 2. Decisiones técnicas ya tomadas (líder — se respetan)

| # | Decisión | Consecuencia en el backlog |
|---|----------|----------------------------|
| D1 | Persistencia JSON en `Documents/mfinance/` vía adapter; puertos permiten swap futuro a SQLite; serde/serde_json aprobados | F4 `persistencia-json`: adapter `infrastructure/` + commands + composition root + seed |
| D2 | Chart.js aprobado explícitamente por el humano en el requerimiento | La feature que lo usa (F7) materializa su alta en `docs/dependencies.md` como parte de sus acceptance |
| D3 | Librería de parseo PDF **sin aprobar** (candidatos: crate Rust `pdf-extract`/`lopdf` vs npm `pdfjs-dist`) | F12 `diagnostico-pdf` con `status: "blocked"` y gate de aprobación humana en acceptance |
| D4 | Lógica pesada en backend hexagonal (`src-tauri/src/domain` + `application`), testeable con `cargo test` sin tauri | F3 crea entidades+puertos+errores; F9/F10/F11/F13/F14/F15 llevan cálculo al backend; front solo renderiza |
| D5 | Seed de datos realistas cuando no hay datos guardados; reemplazable desde UI | Seed en F4; reemplazo/edición desde F5/F6 |
| D6 | Tests: node:test stdlib para arnés; `cargo test` para dominio Rust; lógica TS pura mínima (módulos pequeños o movida a backend) | Acceptance de cada feature exige suite verde (`./init.sh`) |

## 3. Modelo de datos implícito en el requerimiento

- **MonthlyRecord**: clave `YYYY-MM`; `incomes` por fuente `{salario, freelance, arriendos, otros}`; `expenses` por categoría `{vivienda, alimentacion, transporte, cuotas_deuda, ocio, otros}`.
- **Asset**: nombre + valor actual. **Liability**: nombre + saldo + tasa de interés anual.
- **Investment**: familia `{renta_fija, renta_variable, finca_raiz}` + aporte mensual + valor actual + tasa esperada editable.
- **Account / AccountStatement** (conciliación): saldo inicial + movimientos → saldo final esperado vs real.
- **Settings**: pago extra mensual para deuda, estrategia activa (`avalancha|bola`), tasa esperada por familia de inversión, supuestos de proyección.
- **FinanceSnapshot**: raíz agregada que agrupa todo lo anterior; es lo que se persiste/exporta/importa como un JSON único.

## 4. Roadmap por olas

### Ola 0 — Fundación backend (F3)
Entidades Rust puras, puertos (`SnapshotRepository` trait), errores nombrados,
tests `cargo test`. Sin `tauri` en domain/application. Es la base de TODO.

### Ola 1 — Persistencia + shell (F4, F5)
F4: adapter JSON en `Documents/mfinance/`, commands `load/save/export/import`,
composition root en `lib.rs`, seed realista (12 meses de ejemplo con datos
coherentes entre sí: registros, balances, deudas, inversiones).
F5: tipos TS espejo, puerto IPC único adapter, App con navegación por
secciones (placeholders), `tokens.css` base, carga al arrancar, español.

### Ola 2 — Módulos core (F6-F11)
- F6 registro mensual (formularios por fuente/categoría).
- F7 P&G automático: tabla + barras mes a mes + línea ahorro acumulado (Chart.js; alta dependencia aquí).
- F8 balance general: activos/pasivos/patrimonio + evolución mensual graficada.
- F9 plan de deuda: avalancha/bola de nieve, orden de ataque, meses hasta libertad financiera, intereses ahorrados (cálculo backend).
- F10 indicadores semáforo con umbrales EXACTOS: % ingreso a deudas (verde <15%, rojo >30%), tasa de ahorro (verde >15%, roja <5%), meses fondo emergencia (verde 3-6), % gasto cubierto por ingreso pasivo.
- F11 inversiones: aportes por familia + valor futuro a 5/10/20 años con interés compuesto y tasa editable (fusiona módulos 6 y 11 del requerimiento).

### Ola 3 — Avanzados (F12-F16)
- F12 diagnóstico PDF (**blocked** por dependencia sin aprobar): subir PDFs → carpeta por mes → botón analizar → incorporar datos → journey end-to-end probado.
- F13 conciliación: estados de cuenta vs variación de saldos hasta cuadrar el saldo final.
- F14 proyección PyG 12 meses + balance según supuestos editables ("qué puede ir pasando").
- F15 simulador de créditos y pagos optimizable por estrategia (reutiliza motor de amortización de F9).
- F16 cierre mensual: wizard ~10 min (evolución flujo de caja, patrimonio, presupuesto del mes siguiente) + assessment con reglas + consejos continuos (reutiliza semáforo de F10).

## 5. Riesgos y trabas

1. **Dependencia PDF sin aprobar (D3)**: bloquea F12 indefinidamente. Mitigación: nada depende de F12; el resto del producto avanza. La discusión de candidatos (`pdf-extract`/`lopdf` en Rust vs `pdfjs-dist` en JS) queda registrada en la spec de F12 como gate REQ.
2. **Chart.js**: aprobado por el humano en el propio requerimiento, pero el validador `validate-dependencies.mjs` fallará si no está en `docs/dependencies.md`. Por eso su alta es acceptance explícita de F7 (no antes: ninguna feature previa lo necesita).
3. **Límite ≤100 líneas**: el modelo de datos y los formularios son grandes; cada feature se acota a archivos pequeños (entidades separadas por archivo, componentes divididos). Cualquier excepción requiere discusión → `blocked`.
4. **Datos coherentes del seed**: si el seed es incoherente (p. ej. patrimonio negativo o indicadores todos rojos) las gráficas iniciales confunden; el seed debe representar una casa "mixta" con señales mixtas realistas para ejercitar semáforos.
5. **Ruta Documents multiplataforma**: Tauri 2 expone `BaseDirectory::Document`; el adapter no debe hardcodear rutas Windows.
6. **Conciliación y PDF comparten "ingesta"**: mantener puertos distintos (statement-ingest vs pdf-ingest) para que F13 no quede bloqueada por F12.
7. **Interés compuesto y amortización**: precisión de redondeo monetario; decidir aritmética entera en centavos o redondeo determinista testeado en cargo test.

## 6. Criterios de "done" del producto

1. Los 13 módulos del requerimiento tienen feature asociada (F3-F16 cubren 1-13; módulos 6 y 11 fusionados en F11 por decisión de descomposición; extras 12 y 13 fusionados en F16).
2. `./init.sh` verde tras cada feature: formato + tests node:test + build Vite + cargo check/test.
3. Journey principal demostrable: arrancar con seed → editar mes → ver P&G/balance/indicadores actualizados → exportar JSON → importar en otra ruta → mismos datos.
4. Todo texto visible en español; estilos solo con tokens; sin invoke() fuera de `src/adapters/`; dominio sin framework en ambos lados.
5. F12 cerrada solo cuando el humano apruebe la librería PDF y el journey subir→analizar→verificar→actualizar esté probado end-to-end.

## 7. Traza módulo requerido → feature

| Módulo requerido | Feature(s) |
|------------------|-----------|
| 1 Registro mensual | F6 |
| 2 P&G automático | F7 |
| 3 Balance general | F8 |
| 4 Plan de deuda | F9 |
| 5 Indicadores semáforo | F10 |
| 6 Inversiones + 11 Simulador inversiones | F11 (fusionados) |
| 7 Diagnóstico PDF | F12 (blocked) |
| 8 Conciliación | F13 |
| 9 Proyección PyG 12m + supuestos | F14 |
| 10 Simulador créditos | F15 |
| 12 Cierre mensual + 13 Consejos/assessment | F16 (fusionados) |
| Base técnica (dominio, persistencia, shell) | F3, F4, F5 |
