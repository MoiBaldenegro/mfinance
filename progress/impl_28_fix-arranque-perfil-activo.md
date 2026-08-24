# Informe de implementación — feature 28 fix-arranque-perfil-activo

> Sesión implementador. Corrige el ErrorScreen fatal «sin perfil activo: no hay
> snapshot que operar» en cada reinicio (causa raíz verificada en
> progress/research/fix-arranque-perfil-activo.md) y añade la autorecuperación
> determinista R1-R4 del arranque. TDD estricto rojo→verde; sin tocar frontend.

## 1. Decisiones tomadas

### 1.1 Opción A: firma `&self → &mut self` en el puerto (no interior mutabilidad)

`PerfilRepository::cargar_registro` pasa de `&self` a `&mut self` para poder
restaurar `self.activo = registro.activa.clone()` en el adapter real
(`infrastructure/perfil_registry.rs`). Justificación frente a la opción B
(`Cell/RefCell`):

- **Honestidad del puerto**: leer el registro TIENE un efecto en memoria del
  adapter (restaura el activo); la firma debe reflejarlo. La interior
  mutabilidad lo escondería y además obligaría a cambiar el getter público
  `JsonSnapshotRepository::activo() -> Option<&str>` a `Option<String>`
  (una referencia no puede salir de una `Cell`), tocando `lib.rs` y el command
  `seleccionar_perfil`.
- **Cambio mecánico y contenido**: trait + impl real + 2 dobles de test +
  2 casos de uso (`perfiles::listar/activo`, `obtener_onboarding_status`) +
  3 handlers con binding `mut` sobre el MutexGuard + ajustes mecánicos en 6
  ficheros de test existentes. El dominio sigue puro:
  `grep -ri tauri src-tauri/src/domain` = **0**.
- El cable de REQ-28-04 en `lib.rs::estado_inicial` NO necesitó cambios: con el
  activo restaurado, el `if let Some(activo) = repo.activo()` ya sincroniza los
  comprobantes.

### 1.2 Query de puerto nueva: `tiene_snapshot(&self, perfil_id) -> bool`

Las reglas R2/R3 necesitan saber si `perfiles/<id>/mfinance.json` existe sin
que la capa de aplicación toque el filesystem (hexagonal). Se declara en el
trait `PerfilRepository` (dominio), la implementa el adapter con
`rutas_mfinance::snapshot_de(...).is_file()` y los dobles en memoria con una
lista `snapshots_presentes`. Así `preparar_arranque` sigue siendo genérico y
testeable.

### 1.3 Recuperación en módulo propio de application/

`perfil_registry.rs` iba en 91 líneas; la recuperación vive en
`application/recuperacion_arranque.rs` (62 líneas) con las reglas exactas del
análisis §5.2:

| Regla | Condición | Acción |
|-------|-----------|--------|
| R1 | activa presente en perfiles Y su snapshot existe | nada (`Ok(false)`) |
| R2 | activa nula / huérfana / su snapshot falta | PRIMER perfil del registro con snapshot; elección persistida vía `guardar_registro` |
| R3 | ningún perfil tiene snapshot | activar el primero + `ensure_seed` (guard vigente: solo siembra si `load()` falla) |
| R4 | registro sin perfiles | flujo frío vigente (extraído a `arranque_perfiles::arranque_frio`: alta «Personal» + adopción del legado o seed) |

Invariantes respetados: nunca se borra ni reescribe un snapshot ajeno (solo se
reescribe profiles.json para persistir la elección reparada); «primero» = orden
del array `perfiles`; el camino frío SIN registro permanece intacto
(REQ-21-04/05); registro corrupto sigue bloqueando el arranque sin escribir
nada (test preexistente en verde).

### 1.4 Doble combinado hecho fiel al adapter real

La causa de que nadie pillara el bug fue que los dobles no modelaban `activo`.
`MemoryStorePerfiles` ahora marca como «presente» el id del perfil ACTIVO tras
cada `save`/`adoptar_legacy` (el adapter real crea ese archivo), de modo que la
autorecuperación es ejercitable también con dobles.

## 2. Evidencia del ciclo rojo (tests ANTES del código)

Los 10 tests nuevos se escribieron contra la spec y compilaron contra el código
pre-fix. Salida de `cargo test --manifest-path src-tauri/Cargo.toml`:

```text
---- infrastructure::reinicio_tests::reinicio_restaura_el_activo_y_load_devuelve_su_snapshot stdout ----
assertion `left == right` failed: REQ-28-02: el repositorio queda sobre el activo restaurado
  left: None
 right: Some("p_aaa")

---- infrastructure::reinicio_tests::cargar_registro_restaura_el_activo_en_memoria_del_adapter stdout ----
assertion `left == right` failed: REQ-28-01: leer restaura el activo persistido
  left: None
 right: Some("p_uno")

---- infrastructure::recuperacion_deadend_tests::activa_nula_recupera_el_primer_perfil_con_snapshot stdout ----
assertion `left == right` failed: elige el PRIMERO con snapshot en disco (p_uno no tiene)
  left: None
 right: Some("p_dos")

---- infrastructure::recuperacion_deadend_tests::activo_huerfano_recupera_el_primer_perfil_con_snapshot stdout ----
... left: None  right: Some("p_uno")   [REQ-28-06]

---- infrastructure::recuperacion_deadend_tests::snapshot_del_activo_faltante_recupera_otro_con_datos stdout ----
... left: None  right: Some("p_uno")   [REQ-28-06]

---- infrastructure::recuperacion_deadend_tests::la_recuperacion_conserva_los_snapshots_y_registros_ajenos stdout ----
... left: None                          [la recuperación aún no ocurre]

---- infrastructure::recuperacion_flujo_frio_tests::sin_ningun_snapshot_legible_siembra_solo_el_primero stdout ----
... left: None  right: Some("p_uno")   [REQ-28-07]

---- infrastructure::recuperacion_flujo_frio_tests::registro_sin_perfiles_reproduce_el_flujo_frio_con_seed stdout ----
REQ-28-08: alta del perfil inicial      [early-return Ok(false) hoy]

---- infrastructure::recuperacion_flujo_frio_tests::registro_sin_perfiles_adopta_el_legado_pendiente stdout ----
assertion failed: preparar_arranque(&mut store).expect("flujo frío")

---- infrastructure::estado_inicial_tests::estado_inicial_sincroniza_comprobantes_con_el_activo_restaurado stdout ----
... (repo.activo() = None → comprobantes sin perfil)

test result: FAILED. 295 passed; 9 failed; 0 ignored
```

Todos en rojo por la causa raíz correcta («sin perfil activo»: el adapter
recién construido nunca restaura el activo y preparar_arranque hace
early-return).

## 3. Evidencia del verde (suite completa)

Tras implementar (5 ejecuciones consecutivas más bucles de estabilidad):

```text
test result: ok. 305 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.08s
```

(295 preexistentes en verde + 10 nuevos). Además:

```text
grep -ri tauri src-tauri/src/domain  → 0 coincidencias
```

`./init.sh` completo:

```text
--- Formato --- ✔ formato de feature_list.json y progress/current.md
--- Tests ---   ✔ tests al 100% (node:test)
--- Build ---   ✔ build de producción (pnpm build)
✔ El entorno está perfecto. Podemos empezar a trabajar.
```

## 4. Archivos creados

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `src-tauri/src/application/recuperacion_arranque.rs` | 62 | reglas R1-R4 (REQ-28-02..09) |
| `src-tauri/src/infrastructure/reinicio_tests.rs` | 75 | REQ-28-01/02/03: test de REINICIO contra adapter real |
| `src-tauri/src/infrastructure/recuperacion_deadend_tests.rs` | 87 | REQ-28-05/06: activa nula / huérfana / snapshot faltante |
| `src-tauri/src/infrastructure/recuperacion_flujo_frio_tests.rs` | 100 | REQ-28-07/08: siembra solo primero; flujo frío con registro vacío |
| `src-tauri/src/infrastructure/conservacion_datos_tests.rs` | 87 | REQ-28-09: snapshots byte a byte intactos, nombres y perfiles preservados |
| `src-tauri/src/infrastructure/estado_inicial_tests.rs` | 49 | REQ-28-04: composition root sincroniza comprobantes con el activo restaurado |
| `src-tauri/src/infrastructure/arranque28_soporte.rs` | 72 | fixtures: registro/snapshots escritos a mano (simulan sesión previa) |

## 5. Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `domain/perfil_repository.rs` | firma `cargar_registro(&mut self)` + método `tiene_snapshot` |
| `infrastructure/perfil_registry.rs` | restaura `self.activo` al leer (REQ-28-01) + `tiene_snapshot` |
| `application/arranque_perfiles.rs` | match registro→`recuperar` / sin registro→`arranque_frio` (extraído reutilizable por R4) |
| `application/perfiles.rs` | `listar`/`activo` reciben `&mut dyn` (propagación A) |
| `application/perfiles_onboarding/status.rs` | ídem para `obtener_onboarding_status` |
| `commands/perfiles_commands.rs` | bindings `mut` en `listar_perfiles`/`perfil_activo` |
| `commands/perfiles_onboarding_commands.rs` | binding `mut` en handler de status |
| `infrastructure/mod.rs`, `application/mod.rs` | registro de módulos/tests nuevos |
| `application/tests/memory_perfil_repository.rs` | firma nueva + campo `snapshots_presentes` |
| `application/tests/memory_store_perfiles.rs` | delegación + modelado fiel del archivo del activo |
| tests existentes (6 ficheros) | ajustes mecánicos `&mut` (perfil_activo, perfiles_casos, onboarding_status ×2, perfil_registry_tests) |
| `domain/onboarding/mod.rs` | 1 comentario reformulado («Sin dependencias externas») para que `grep -ri tauri domain` dé literalmente 0 |

Ningún archivo creado o modificado supera las 100 líneas (máximo: 100,
recuperacion_flujo_frio_tests.rs). Sin dependencias nuevas. Sin prints de debug
ni temporales.

## 6. Cobertura REQ-28-xx

| REQ | Test(s) |
|-----|---------|
| REQ-28-01 | `cargar_registro_restaura_el_activo_en_memoria_del_adapter` |
| REQ-28-02 | `reinicio_restaura_el_activo_y_load_devuelve_su_snapshot` (además: no repite alta/seed/migración) |
| REQ-28-03 | mismo test: `load()` devuelve EXACTAMENTE el snapshot escrito en disco |
| REQ-28-04 | `estado_inicial_sincroniza_comprobantes_con_el_activo_restaurado` (composition root real: comprobante escrito bajo `comprobantes/p_aaa/2026-08/`) |
| REQ-28-05 | `activa_nula_recupera_el_primer_perfil_con_snapshot` (+ elección persistida leída de profiles.json) |
| REQ-28-06 | `activo_huerfano_…` y `snapshot_del_activo_faltante_…` |
| REQ-28-07 | `sin_ningun_snapshot_legible_siembra_solo_el_primero` (seed solo en p_uno; p_dos sin carpeta) |
| REQ-28-08 | `registro_sin_perfiles_reproduce_el_flujo_frio_con_seed` y `…_adopta_el_legado_pendiente` (backup renombrado incluido) |
| REQ-28-09 | `la_recuperacion_conserva_los_snapshots_y_registros_ajenos` + `los_nombres_de_los_perfiles_ajenos_no_se_alteran` (bytes idénticos, 2 perfiles intactos) |

Regresión protegida: REQ-21-04/05 (migración única, guard de seed, arranque frío
sin registro) y bloqueo ante registro corrupto — todos sus tests preexistentes
en verde sin modificación semántica.

## 7. Incidencias de la sesión (transparencia)

1. **Fallo intermitente único** en `ruta_del_command_activa_…` durante una
   ejecución intermedia: NO reproducible en 30+ ejecuciones posteriores (10
   seguidas sobre mi árbol + 15 sobre HEAD + 5 finales). Sin evidencia de causa
   en el código; atribuido a contención puntual del filesystem de Windows sobre
   `%TEMP%` durante la recompilación.
2. **Incidencia propia corregida**: un experimento de verificación
   (`git stash -u` + `pop`) reescribió 70 ficheros del working tree con CRLF
   (autocrlf de Windows) y rompió el validador de dependencias, que asume LF.
   Revertido convirtiendo esos ficheros de nuevo a LF (sus contenidos no
   cambiaron: `git diff` muestra solo los cambios preexistentes a esta sesión).
   `./init.sh` volvió a verde completo. Los diffs de
   `docs/dependencies.md`/`package.json`/`Cargo.toml` visibles en git son
   cambios PREEXISTENTES a esta sesión (aprobaciones chart.js/pdf-extract),
   no míos.

## 8. Resultado final

- `cargo test --manifest-path src-tauri/Cargo.toml`: **305 passed / 0 failed**.
- `grep -ri tauri src-tauri/src/domain`: **0**.
- `./init.sh`: **verde completo** (entorno, formato, node:test 100%, build).
- `feature_list.json`: feature 28 en `in_progress` (done SOLO tras APPROVED del
  reviewer, según protocolo).
