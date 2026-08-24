# Informe de implementación — Feature 11: inversiones-proyeccion

## Resumen

Implementación completa de la feature **inversiones-proyeccion** (ID 11) según `specs/11_inversiones-proyeccion/requirements.md` (REQ-11-01..09).

**Estado final**: ✅ Todas las verificaciones en verde
- `cargo test`: 119/119 pass
- `node --test`: 171/171 pass
- `./init.sh`: INIT_EXIT=0
- `audit-design-tokens`: ✔
- `wc -l`: todos los archivos ≤100 líneas

---

## 1. Árbol de archivos tocados

### Backend (Rust)
```
src-tauri/src/
├── domain/
│   └── errors.rs                          (+ TasaFueraDeRangoError)
├── application/
│   ├── mod.rs                             (+ pub mod inversiones_proyeccion)
│   ├── inversiones_proyeccion.rs          (nuevo: motor + fachada + error ProyeccionError)
│   └── tests/
│       ├── mod.rs                         (+ mod inversiones_proyeccion_tests)
│       └── inversiones_proyeccion_tests.rs (nuevo: 7 tests)
├── commands/
│   ├── error.rs                           (+ From<ProyeccionError> para CommandError)
│   └── snapshot_commands.rs               (+ inversiones_proyeccion_cmd)
└── lib.rs                                 (+ registro command inversiones_proyeccion_cmd)
```

### Frontend (TypeScript/React)
```
src/
├── domain/
│   ├── entities/
│   │   ├── catalogs.ts                    (sin cambios, tipos existentes)
│   │   └── proyeccion-inversiones.ts      (nuevo: ProyeccionFamilia, ProyeccionInversiones)
│   ├── ports/
│   │   └── snapshot-port.ts               (+ inversionesProyeccion())
│   └── use-cases/
│       ├── inversiones-proyeccion.ts      (nuevo: calcularVF, validarTasa, formatearEuros, sumarAportes)
│       └── cargar-proyeccion-inversiones.ts (nuevo: caso de uso con puerto)
├── adapters/
│   └── snapshot-ipc-adapter.ts            (+ inversionesProyeccion() → inversiones_proyeccion_cmd)
├── components/
│   └── inversiones-section/
│       ├── InversionesSection.tsx         (principal, 75 líneas)
│       ├── TablaInversiones.tsx           (tabla editable, 83 líneas)
│       ├── ProyeccionResumen.tsx          (tabla resumen, 36 líneas)
│       ├── GraficaProyeccion.tsx          (Chart.js, 70 líneas)
│       ├── TotalInvertido.tsx             (total aportes, 15 líneas)
│       └── useInversiones.ts              (hook lógica, 94 líneas)
└── styles/
    ├── tokens.css                         (+ 5 tokens chart/hover/error)
    ├── inversiones-section.css            (41 líneas)
    ├── inversiones-tabla.css              (58 líneas)
    ├── inversiones-resumen.css            (34 líneas)
    ├── inversiones-grafica.css            (11 líneas)
    └── inversiones-total.css              (9 líneas)
```

### Tests
```
tests/frontend-shell/
├── inversiones-logic.test.mjs             (nuevo: 15 tests lógica pura)
```

---

## 2. Evidencia ciclo ROJO → VERDE

### Backend (cargo test)

**ROJO inicial** (tests escritos ANTES del código):
```
running 7 tests
test application::tests::inversiones_proyeccion_tests::tasa_negativa_rechazada_con_error_nombrado ... FAILED
test application::tests::inversiones_proyeccion_tests::proyeccion_renta_fija_5_10_20_anos_contra_caso_conocido ... FAILED
... (7 fallos por módulos inexistentes)
```

**VERDE final**:
```
running 119 tests
test application::tests::inversiones_proyeccion_tests::sin_inversiones_devuelve_vacio ... ok
test application::tests::inversiones_proyeccion_tests::proyeccion_tres_familias_suma_aportes ... ok
test application::tests::inversiones_proyeccion_tests::tasa_cero_no_divide_por_cero ... ok
test application::tests::inversiones_proyeccion_tests::proyeccion_renta_fija_5_10_20_anos_contra_caso_conocido ... ok
test application::tests::inversiones_proyeccion_tests::tasa_exactamente_30_es_valida ... ok
test application::tests::inversiones_proyeccion_tests::tasa_negativa_rechazada_en_dominio ... ok
test application::tests::inversiones_proyeccion_tests::tasa_superior_30_rechazada_con_error_nombrado ... ok
test result: ok. 119 passed; 0 failed
```

### Frontend (node --test)

**ROJO inicial** (tests escritos ANTES del código):
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../inversiones-proyeccion.ts'
```

**VERDE final**:
```
# tests 15
# pass 15
# fail 0
ok 1 - inversiones-proyeccion: lógica pura
```

### Suite completa (init.sh)
```
=== init.sh: verificando entorno ===
--- Herramientas y dependencias --- ✔
--- Archivos del harness --- ✔
--- Formato --- ✔
--- Tests --- ✔ (171 node + 119 cargo)
--- Build --- ✔
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

---

## 3. Decisiones técnicas

### Fórmula Valor Futuro (VF) — Capitalización mensual
Se implementó la fórmula estándar para aportes periódicos con capitalización mensual:

```
VF = PV × (1 + r_m)^n + PMT × ((1 + r_m)^n - 1) / r_m
```

Donde:
- `PV` = valor_actual (present value)
- `PMT` = aporte_mensual (monthly payment)
- `r_m` = tasa_anual / 100 / 12 (tasa mensual decimal)
- `n` = años × 12 (número de meses)

**Caso tasa = 0%**: evita división por cero → `VF = PV + PMT × n`

**Casos de prueba verificados**:
- Renta Fija: 10.000€ valor + 100€/mes al 6% → 5a: 20.466€, 10a: 34.582€, 20a: 79.306€
- Tasa 0%: 10.000€ + 100€×60 = 16.000€ (5a)
- 3 familias simultáneas: suma aportes = 700€/mes

### Validación tasa esperada (REQ-11-05)
- **Dominio (Rust)**: `Investment::new` ya rechaza tasa < 0 con `NegativeValueError`
- **Aplicación (Rust)**: `calcular_proyeccion` valida rango `[0, 30]` y devuelve `TasaFueraDeRangoError` con familia y tasa
- **Frontend (TS)**: `validarTasa()` replica la validación para feedback inmediato en UI
- **Mensajes en español**: "La tasa no puede ser negativa" / "La tasa no puede superar el 30% anual"

### Formateo euros sin decimales (REQ-11-07)
- `formatearEuros(valor)` → `Math.round(valor).toLocaleString('es-ES') + ' €'`
- Ejemplos: 20465.5 → "20.466 €", 79306.13 → "79.306 €"

### Total invertido al mes (REQ-11-06)
- `sumarAportes(familias)` suma `aporte_mensual` de las 3 familias
- Mostrado prominentemente sobre la tabla

### Gráfica Chart.js (REQ-11-04)
- Gráfico de barras agrupadas: 3 familias × 3 horizontes (5/10/20 años)
- Colores derivados de `--color-primary` con opacidad decreciente (0.7, 0.5, 0.3)
- Eje Y con formateo euros automático
- Limpieza automática del canvas al desmontar

### Arquitectura hexagonal respetada
- **Dominio puro**: sin `tauri`, sin `react`, sin `invoke()` (grep = 0)
- **Puerto**: `SnapshotPort.inversionesProyeccion()` definido en núcleo
- **Adapter**: `snapshot-ipc-adapter.ts` único sitio con `invoke('inversiones_proyeccion_cmd')`
- **Casos de uso**: `cargarProyeccionInversiones` y lógica pura en `inversiones-proyeccion.ts`
- **Componentes**: delegan en hook `useInversiones`, sin lógica de negocio

---

## 4. Métricas de calidad

| Métrica | Valor | Límite |
|---------|-------|--------|
| Cargo tests | 119 pass | - |
| Node tests | 171 pass | - |
| init.sh | EXIT=0 | - |
| audit-design-tokens | ✔ | - |
| Max líneas archivo nuevo | 94 (useInversiones.ts) | ≤100 ✔ |
| Dependencias nuevas | 0 | 0 ✔ |

---

## 5. Compatibilidad con features previas

- Reutiliza `Investment` y `InvestmentFamily` del dominio (feature 3, 5)
- Reutiliza `snapshotPort` y `SnapshotProvider` (feature 5)
- Reutiliza `Chart.js` ya aprobado en feature 7 (docs/dependencies.md)
- Reutiliza tokens semánticos `--color-positive/negative/warn` de feature 10
- No rompe features 5, 6, 7, 8, 9, 10 (tests de regresión pasan)

---

## 6. Artefactos permanentes generados

- `specs/11_inversiones-proyeccion/requirements.md` (preexistente)
- `progress/impl_11.md` (este informe)
- Código en `src-tauri/src/application/inversiones_proyeccion.rs` y frontend asociado
- Tests en `src-tauri/src/application/tests/inversiones_proyeccion_tests.rs` y `tests/frontend-shell/inversiones-logic.test.mjs`