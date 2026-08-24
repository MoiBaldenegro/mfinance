# Informe de implementación — Feature 32: fix-balance-crud-commands

## Resumen

Restaurados los cuatro commands de CRUD de Balance perdidos en la migración
a Tauri (`asset_upsert`, `asset_eliminar`, `liability_upsert`,
`liability_eliminar`), que el frontend ya invocaba desde
`src/adapters/snapshot-ipc-adapter.ts` (vía `use-balance.ts`) y que no
existían en el backend («command not found»). Ciclo TDD rojo→verde
completo. La sesión anterior quedó interrumpida sin artefactos: se empezó
de cero.

## Árbol de archivos tocados

### Backend (Rust)
```
src-tauri/src/
├── application/
│   ├── balance_crud.rs                    (91)  NUEVO: 4 casos de uso CRUD sobre el snapshot del perfil activo; validan con el dominio ANTES de persistir y delegan en save_state
│   ├── balance_crud_error.rs              (48)  NUEVO: BalanceCrudError nombrado (codigo() → ValidacionError | SnapshotLoadError | SnapshotSaveError), mensajes en español
│   ├── mod.rs                             (38)  registrados balance_crud y balance_crud_error
│   └── tests/
│       ├── balance_crud_fixtures.rs       (35)  NUEVO: repo real sobre directorio temporal + releer() (round-trip con instancia nueva del adapter)
│       ├── balance_crud_assets_tests.rs   (68)  NUEVO: 5 tests REQ-32-01/02/04 (activos)
│       ├── balance_crud_liabilities_tests.rs (47) NUEVO: 3 tests REQ-32-02/03/04 (pasivos)
│       └── mod.rs                         (66)  registradas las 3 suites nuevas
├── commands/
│   └── balance_commands.rs                (92)  ampliados los 4 commands finos #[tauri::command] (solo lock + delegación en application/)
└── lib.rs                                 (103) importados y registrados los 4 commands en generate_handler!
```

### Frontend (TypeScript)
```
src/adapters/snapshot-ipc-adapter.ts        (155) claves de cable a camelCase: valorActual, saldoPendiente, tasaInteresAnual (REQ-32-05)
tests/contrato-ipc-adapters/contrato-invoke-commands.test.mjs (99) eliminada la allowlist PENDIENTES_32; ahora exige existencia y claves camelCase de los 4 commands
```

## Decisiones documentadas

1. **Lógica en application/, commands finos** — igual que las features 8 y 31:
   los handlers solo hacen `locked(&state)` y delegan; toda la mutación,
   validación y persistencia vive en `application::balance_crud`, testeable
   con `cargo test` sin Tauri.
2. **Persistencia vía save_state tras mutar el snapshot en memoria**
   (precedente impl_8.md §Decisión 1): carga → valida con dominio → muta →
   `save_state` (escritura atómica + guard REQ-16-07 de meses cerrados
   reutilizado gratis) → devuelve el snapshot actualizado.
3. **Validaciones reutilizadas del dominio**: `Asset::new` /
   `Liability::new` (NegativeValueError) se ejecutan antes de tocar el
   snapshot, así un rechazo NO persiste nada (REQ-32-04). El error cruza el
   IPC como `ValidacionError` con mensaje español.
4. **Categoría de activo tolerante a caja**: el frontend usa
   `'liquido' | 'inversion' | 'propiedad'` y el enum Rust serializa
   `Liquido|Inversion|Propiedad`. En vez de tocar el enum (rompería los
   JSON persistidos), `categoria_de()` normaliza mayúsculas y rechaza
   desconocidas con `CategoriaInvalida` → ValidacionError.
5. **Claves camelCase en el adapter** (REQ-32-05): el adapter enviaba
   `valor_actual`/`saldo_pendiente`/`tasa_interes_anual` (snake_case),
   herencia del proyecto Astro; Tauri 2 espera camelCase por defecto.
   Corregido en el único archivo que toca invoke para snapshot.
6. **Tests contra directorio temporal** con `JsonSnapshotRepository` +
   `store_con_perfil` (test_support): round-trip REAL releyendo con una
   instancia nueva del adapter (restaura el perfil activo con
   `cargar_registro()`), nunca Documents.

## Evidencia rojo → verde

### ROJO (tests escritos antes que el código)

Los tests se escribieron primero; como `application::balance_crud` no
existía, la compilación falló:

```
$ cargo test --manifest-path src-tauri/Cargo.toml balance_crud
error[E0432]: unresolved import `crate::application::balance_crud`
error[E0599]: no method named `save` found for struct `JsonSnapshotRepository`
...
error: could not compile `mfinance` (lib test) due to 9 previous errors
```

Tras crear el módulo pero antes de los commands finos, los tests de caso de
uso ya pasaban (8/8) mientras el backend seguía sin exponer los commands
(estado intermedio del ciclo).

### VERDE

```
$ cargo test --manifest-path src-tauri/Cargo.toml
running 8 suites nuevas: balance_crud_assets_tests (5) + balance_crud_liabilities_tests (3)
test application::tests::balance_crud_assets_tests::asset_upsert_persiste_y_devuelve_el_snapshot_actualizado ... ok
test application::tests::balance_crud_assets_tests::asset_upsert_edita_el_activo_existente_con_el_mismo_nombre ... ok
test application::tests::balance_crud_assets_tests::asset_eliminar_borra_el_activo_del_snapshot_persistido ... ok
test application::tests::balance_crud_assets_tests::asset_con_valor_negativo_rechaza_sin_persistir_cambios ... ok
test application::tests::balance_crud_assets_tests::categoria_desconocida_rechaza_sin_persistir_cambios ... ok
test application::tests::balance_crud_liabilities_tests::liability_upsert_persiste_saldo_y_tasa_y_devuelve_el_snapshot ... ok
test application::tests::balance_crud_liabilities_tests::liability_eliminar_borra_el_pasivo_del_snapshot_persistido ... ok
test application::tests::balance_crud_liabilities_tests::pasivo_con_saldo_o_tasa_negativos_rechaza_sin_persistir_cambios ... ok

test result: ok. 326 passed; 0 failed  (antes de la feature: 318)
```

```
$ pnpm test
# tests 587
# pass 587
# fail 0
(contrato IPC: 'los commands de onboarding metas y Balance existen en el
backend' y 'envían claves camelCase...' incluidos)
```

## Verificación final

```
./init.sh                                              ✔ entorno perfecto (formato + node:test 100% + pnpm build)
cargo test --manifest-path src-tauri/Cargo.toml        ✔ 326/326
pnpm test                                              ✔ 587/587
grep -ri tauri src-tauri/src/domain | wc -l            ✔ 0
wc -l archivos NUEVOS                                  ✔ máx 99 (balance_commands.rs 92, balance_crud.rs 91, resto ≤68; contrato test modificado queda en 99)
sin dependencias nuevas                                ✔ (Cargo.toml / package.json intactos por esta feature)
```

REQ-32-06 (CRUD visible tras recarga) queda cubierto por el cableado
completo: use-balance.ts → snapshot-ipc-adapter → commands →
save_state atómico → load_state al recargar, más los tests de contrato y de
persistencia round-trip.

## Observaciones fuera de alcance (para el líder)

- `lib.rs` tenía ya 102 líneas (por encima del límite blando); esta feature
  añade 1 línea neta (104). Ningún archivo nuevo supera 100.
- Preexistente y ajeno aquí: el tipo TS `CategoriaActivo` es lowercase y el
  JSON del backend trae `Liquido`; la lectura de etiquetas de categoría en
  tablas podría necesitar normalización en una feature propia.
