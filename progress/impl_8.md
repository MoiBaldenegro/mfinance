# Informe de implementación — Feature 8: balance-general

## Resumen
Implementación completa del Módulo 3: Balance general con activos, pasivos, patrimonio y evolución graficada (REQ-08-01..07).

## Árbol de archivos tocados (con líneas)

### Backend (Rust)
```
src-tauri/src/
├── domain/
│   ├── asset.rs              (44)  ← añadido AssetCategory enum
│   └── liability.rs          (42)  ← sin cambios
├── application/
│   ├── balance_serie.rs      (89)  ← NUEVO: caso de uso balance completo
│   ├── mod.rs                (16)  ← registrado balance_serie
│   ├── entity_validation.rs  (54)  ← adaptado a Asset con categoría
│   └── tests/
│       ├── balance_tests.rs  (74)  ← NUEVO: 6 tests REQ-08-03/05
│       ├── import_validation_tests.rs (62)  ← actualizado JSON con categoria
│       └── mod.rs            (9)   ← registrado balance_tests
├── commands/
│   ├── snapshot_commands.rs  (148) ← añadidos balance_serie, asset_upsert, asset_eliminar, liability_upsert, liability_eliminar
│   └── error.rs              (53)  ← añadido CommandError::validacion
├── seed/
│   └── patrimony.rs          (71)  ← actualizado seed con categorías
├── domain/tests/
│   ├── asset_tests.rs        (35)  ← actualizado a Asset con categoría
│   └── snapshot_tests.rs     (61)  ← actualizado Asset con categoría
└── lib.rs                    (54)  ← registrados 4 nuevos commands
```

### Frontend (TypeScript/React)
```
src/
├── domain/
│   ├── entities/
│   │   ├── asset.ts              (10)  ← añadido categoria
│   │   ├── balance-serie.ts      (34)  ← NUEVO: tipos BalanceCompleto, TotalesBalance, SerieBalance
│   │   └── liability.ts          (8)   ← sin cambios
│   ├── ports/
│   │   └── snapshot-port.ts      (38)  ← añadidas 6 operaciones Balance + Asset/Liability CRUD
│   ├── use-cases/
│   │   ├── balance-totales.ts    (18)  ← NUEVO: calcularTotalesBalance
│   │   ├── balance-tabla.ts      (57)  ← NUEVO: activosAFilas, pasivosAFilas, catálogos
│   │   ├── balance-grafica.ts    (46)  ← NUEVO: datosDeGraficaBalance
│   │   ├── balance-validaciones.ts (35) ← NUEVO: validarActivo, validarPasivo
│   │   └── balance-vacio.ts      (11)  ← NUEVO: estaVacio, MENSAJE_SIN_PATRIMONIO
│   └── use-cases/
├── adapters/
│   └── snapshot-ipc-adapter.ts   (80)  ← ampliado con 6 operaciones nuevas
├── components/balance-section/
│   ├── BalanceSection.tsx        (87)  ← reescrito completo
│   ├── BalanceTable.tsx          (51)  ← NUEVO: wrapper ActivosTable + PasivosTable
│   ├── ActivosTable.tsx          (68)  ← NUEVO: tabla Activos con CRUD
│   ├── ActivoForm.tsx            (95)  ← NUEVO: formulario Activo
│   ├── PasivosTable.tsx          (66)  ← NUEVO: tabla Pasivos con CRUD
│   ├── PasivoForm.tsx            (92)  ← NUEVO: formulario Pasivo
│   ├── BalanceCards.tsx          (39)  ← NUEVO: 3 tarjetas resumen
│   ├── BalanceChart.tsx          (77)  ← NUEVO: gráfica línea patrimonio
│   └── use-balance.ts            (76)  ← NUEVO: hook React con recarga automática
├── styles/
│   ├── balance-section.css       (28)  ← actualizado
│   ├── balance-cards.css         (36)  ← NUEVO
│   ├── balance-chart.css         (20)  ← NUEVO
│   ├── balance-table.css         (4)   ← NUEVO: wrapper
│   ├── balance-tables-base.css   (20)  ← NUEVO: estilos base tabla
│   ├── balance-forms.css         (98)  ← NUEVO: estilos formulario
│   ├── activos-table.css         (2)   ← NUEVO: @import
│   └── pasivos-table.css         (2)   ← NUEVO: @import
└── tests/frontend-shell/
    ├── balance-totales.test.mjs      (43) ← NUEVO: 4 tests
    ├── balance-tabla.test.mjs        (50) ← NUEVO: 4 tests
    ├── balance-grafica.test.mjs      (48) ← NUEVO: 4 tests
    ├── balance-validaciones.test.mjs (52) ← NUEVO: 7 tests
    └── balance-vacio.test.mjs        (28) ← NUEVO: 2 tests
```

## Decisiones documentadas

### 1. Backend: upsert/eliminar vs save_state
**Decisión**: Se implementaron commands finos `asset_upsert`, `asset_eliminar`, `liability_upsert`, `liability_eliminar` que delegan internamente en `save_state` tras modificar el snapshot en memoria.
**Motivo**: 
- Permite validación de dominio (valores negativos rechazados con `NegativeValueError`) antes de persistir.
- UX optimista: el frontend recibe el snapshot actualizado inmediatamente.
- Mantiene la arquitectura: commands finos sin lógica de negocio, delegando en `save_state` que ya persiste atómicamente.
- Coherente con patrón F4/F7 (commands finos por operación).

### 2. Ciclo de vida del canvas (BalanceChart)
**Patrón**: Idéntico a `PygChart` (F7): `useRef<HTMLCanvasElement>` + `useEffect` con `chart.destroy()` en cleanup.
- Se destruye al cambiar `serie` (refresco por nueva operación) o al desmontar.
- Colores leídos de tokens CSS via `getComputedStyle` (cero hex en componentes).
- `responsive: true, maintainAspectRatio: false` para adaptarse al contenedor.

### 3. Refresco automático tras cambios
**Patrón**: El hook `useBalance` expone `mutarYRecargar` que:
1. Ejecuta la mutación (asset_upsert, etc.)
2. Llama a `recargar()` que invoca `balance_serie` y actualiza estado local
3. El `SnapshotProvider` no necesita `aplicarSnapshot` porque el comando devuelve el snapshot completo actualizado.
- Esto simplifica el flujo vs F6 (Registro) donde se usaba `aplicarSnapshot`.

### 4. Asset con categoría (breaking change en dominio)
**Cambio**: `Asset::new(nombre, categoria, valor_actual)` requiere `AssetCategory` (Liquido|Inversion|Propiedad).
- Migración: seed, entity_validation, snapshot_tests, import_validation_tests actualizados.
- Compatibilidad: `entity_validation` usa la categoría serializada; snapshots antiguos sin categoría no deberían existir (seed ya la incluye).

### 5. Línea única en gráfica (vs barras+línea en P&G)
**Decisión**: La gráfica de Balance muestra solo una serie de tipo `line` para el patrimonio (REQ-08-05).
- Sin barras de activos/pasivos porque la evolución mensual del patrimonio es una sola magnitud.
- Área bajo la línea (`fill: true`) con 20% opacidad del color primario.

### 6. Validaciones negativas (REQ-08-06)
- Frontend: `validarActivo`/`validarPasivo` puras, rechazan antes de llamar al command.
- Backend: constructores `Asset::new`/`Liability::new` rechazan con `NegativeValueError` (código `ValidacionError` vía IPC).
- Mensajes en español, sin persistir.

## Evidencia rojo → verde

### Backend (cargo test)
```
# Tests NUEVOS balance_tests (6 tests)
running 6 tests
test ... sin_activos_ni_pasivos_devuelve_ceros_y_serie_vacia ... ok
test ... solo_activos_suma_correcta_y_patrimonio_igual_activos ... ok
test ... solo_pasivos_suma_correcta_y_patrimonio_negativo ... ok
test ... activos_y_pasivos_patrimonio_es_diferencia ... ok
test ... la_serie_queda_ordenada_por_mes_ascendente ... ok
test ... calcular_serie_balance_devuelve_fila_con_totales_y_patrimonio ... ok
test result: ok. 6 passed

# Suite completa: 72/72 passed
```

### Frontend (node --test)
```
# Tests NUEVOS balance (21 tests totales)
running 5 suites
ok 1 - balance-totales.test.mjs (4 tests)
ok 2 - balance-tabla.test.mjs (4 tests)
ok 3 - balance-grafica.test.mjs (4 tests)
ok 4 - balance-validaciones.test.mjs (7 tests)
ok 5 - balance-vacio.test.mjs (2 tests)

# Suite completa: 123/123 passed
```

### Verificaciones finales
```
./init.sh → INIT_EXIT=0 ✔
cargo test → 72/72 ✔
pnpm test → 123/123 ✔
pnpm build ✔
audit-design-tokens ✔
wc -l máx → 98 líneas (balance-forms.css, ActivoForm.tsx) ✔
```

## Testing strategy
- **Test-first**: Todos los tests de dominio/backend y use-cases/frontend escritos ANTES que el código.
- **ROJO observado**: Tests fallando por módulos inexistentes → implementación → VERDE.
- **Cobertura**: REQ-08-01/02 (CRUD), 03 (totales), 04 (tarjetas), 05 (gráfica), 06 (validaciones), 07 (refresco).

## Archivos de test como evidencia
- `progress/impl_8.md` (este informe)
- Tests backend: `src-tauri/src/application/tests/balance_tests.rs`
- Tests frontend: `tests/frontend-shell/balance-*.test.mjs` (5 archivos, 21 tests)