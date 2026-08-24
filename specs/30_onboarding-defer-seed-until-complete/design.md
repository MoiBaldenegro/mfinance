# Decisión de diseño REQ-30-05: Snapshot post-onboarding

## Contexto

La feature 30 mueve la siembra de datos de ejemplo (seed) del arranque frío y la autorecuperación R3 al momento de `completar_onboarding`. La decisión es qué snapshot sembrar:

- **Opción A**: `seed::example_snapshot()` — 12 meses de datos de ejemplo realistas (ingresos, gastos, activos, pasivos, inversiones, estados de cuenta conciliados)
- **Opción B**: Snapshot vacío mínimo (`FinanceSnapshot::default()`) — sin datos, solo estructura vacía

## Decisión: **Opción B — Snapshot vacío mínimo**

### Justificación

1. **Coherencia con el objetivo de la feature**: El enunciado dice "el usuario post-onboarding ve sus datos reales (o vacío limpio), nunca datos ajenos". Un snapshot vacío cumple "vacío limpio"; el seed real serían "datos ajenos".

2. **El onboarding captura los datos del usuario**: Los pasos 1-4 del wizard capturan:
   - Paso 1: nombre, moneda, fuentes de ingreso, categorías de gasto
   - Paso 2: activos, pasivos, inversiones iniciales con tasas
   - Paso 3: estrategia de deuda, pago extra, supuestos de proyección
   - Paso 4: umbrales de indicadores, metas/journal
   
   Estos datos se consolidan en `StrategySettings`, `Investment.tasa_esperada`, `financial_profile` y `goals_journal` al completar. El usuario ya ha provisto su configuración inicial; no necesita datos de ejemplo.

3. **Evita confusión**: Los datos de ejemplo (salario, alquiler, hipoteca, etc.) no pertenecen al usuario y requieren limpieza manual. Un inicio limpio respeta la autonomía del usuario.

4. **Consistencia con "Saltar onboarding"**: El botón "Saltar" en el paso 1 crea un perfil mínimo con `onboarding_status = Completed` y sin snapshot. Si el usuario completa el onboarding, la experiencia debe ser equivalente: snapshot limpio sobre el que construir.

5. **Migración legacy sin cambios**: Los perfiles pre-onboarding (feature 23) migran con `onboarding_status = Completed` y conservan su snapshot intacto (REQ-30-08). No hay riesgo de pérdida de datos.

### Implementación

- `completar_onboarding_en_adaptador` (en `finalizar.rs`): al consolidar, si `load()` falla con `SnapshotLoadError` por "sin perfil activo no hay snapshot que operar" (snapshot inexistente), crea `FinanceSnapshot::default()`, aplica `aplicar_onboarding_a_snapshot` y guarda.
- Si `load()` tiene éxito (snapshot ya existe), **no** sobrescribe: solo aplica `aplicar_onboarding_a_snapshot` sobre lo existente y guarda (comportamiento actual preservado).
- `arranque_frio`: elimina la llamada a `ensure_seed`.
- `recuperar` regla R3: elimina la llamada a `ensure_seed`; persiste el activo elegido y devuelve `Ok(false)`.
- `load_state`: ya devuelve `SnapshotLoadError` con el mensaje requerido ("sin perfil activo no hay snapshot que operar") cuando no hay activo o no existe el archivo.

### Tests TDD (REQ-30-07)

1. `arranque_frio_crea_perfil_sin_snapshot`: `preparar_arranque` en directorio temporal sin registro → crea perfil "Personal" con `onboarding_status = NotStarted`, **no** existe `perfiles/<id>/mfinance.json`.
2. `completar_onboarding_siembra_si_no_existe`: perfil NotStarted sin snapshot → `completar_onboarding` → snapshot creado (`FinanceSnapshot::default()` con onboarding aplicado).
3. `completar_onboarding_no_resiembra_si_existe`: perfil con snapshot previo → `completar_onboarding` → snapshot previo conservado, solo onboarding aplicado encima.
4. `reinicio_post_onboarding_carga_snapshot_sembrado`: completar onboarding → reinicio (nuevo `JsonSnapshotRepository` + `preparar_arranque`) → `load_state` devuelve el snapshot sembrado.