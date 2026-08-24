# Review — feature 28 fix-arranque-perfil-activo

**Veredicto:** APPROVED

Revisión realizada contra `specs/28_fix-arranque-perfil-activo/requirements.md`
(REQ-28-01..09), criterios de aceptación de la feature 28 en
`feature_list.json`, el análisis de referencia
`progress/research/fix-arranque-perfil-activo.md`, `docs/architecture.md`,
`docs/conventions.md` y `CHECKPOINTS.md`. Todas las verificaciones objetivas
fueron **ejecutadas por el reviewer**, no tomadas del informe.

## Resultados de comandos ejecutados por el reviewer

| Verificación | Resultado |
|--------------|-----------|
| `cargo test --manifest-path src-tauri/Cargo.toml` | ✔ **305 passed; 0 failed** (incluye los 10 tests nuevos de f28 en verde) |
| `grep -ri tauri src-tauri/src/domain` | ✔ **0 coincidencias** (exit=1) |
| `./init.sh` completo | ✔ **verde**: herramientas, formato (`check-format.mjs` + validador de dependencias), node:test 100%, build producción |
| `wc -l` sobre archivos creados/modificados | ✔ máximo **100** (`recuperacion_flujo_frio_tests.rs`, `lib.rs`); ninguno supera el límite |
| grep `print!/println!/dbg!/eprintln!` en `src-tauri/src` | ✔ 0 coincidencias |
| grep `TODO/FIXME/XXX` en archivos nuevos | ✔ 0 coincidencias |
| Dependencias nuevas | ✔ ninguna: validador verde; `chart.js`/`pdf-extract` ya estaban registradas en `docs/dependencies.md` (preexistentes, confirmando el informe §7.2) |

## Tabla REQ por REQ

| REQ | Cubierto | Evidencia verificada |
|-----|----------|----------------------|
| REQ-28-01 | ✔ | `perfil_registry.rs` L34 restaura `self.activo` al deserializar; firma `&mut self` documentada en el puerto (`domain/perfil_repository.rs` L13-17). Test `reinicio_tests::cargar_registro_restaura_el_activo_en_memoria_del_adapter` contra el adapter REAL. |
| REQ-28-02 | ✔ | Test `reinicio_restaura_el_activo_y_load_devuelve_su_snapshot`: adapter REAL recién construido sobre directorio temporal con profiles.json + snapshot preescritos a mano (`arranque28_soporte.rs`); afirma además `!preparar_arranque(...)` (no repite alta/seed/migración). **Cubre el bug original**: revirtiendo el fix, `cargar_registro` no restauraría el activo y el assert `store.activo() == Some("p_aaa")` (L64) fallaría con `None`. |
| REQ-28-03 | ✔ | Mismo test L69-73: `store.load()` devuelve EXACTAMENTE el snapshot escrito en disco (comparación de valor completo, marca 555.0 distinguible del seed). |
| REQ-28-04 | ✔ | `estado_inicial_tests.rs` ejercita el composition root real (`crate::estado_inicial(base)`): repo queda sobre el activo restaurado y un comprobante guardado aterriza en `comprobantes/p_aaa/2026-08/ticket.pdf`. Cable en `lib.rs` L42-44 confirmado sin cambios. |
| REQ-28-05 | ✔ | `recuperacion_deadend_tests::activa_nula_recupera_el_primer_perfil_con_snapshot`: elige el PRIMERO CON snapshot (p_dos, no p_uno) y la elección queda persistida leyendo profiles.json de disco (L39-43). |
| REQ-28-06 | ✔ | Dos tests: `activo_huerfano_…` (activa→p_fantasma ausente) y `snapshot_del_activo_faltante_…` (activo p_dos sin archivo). Ambos caen al primero con datos y persisten. |
| REQ-28-07 | ✔ | `sin_ningun_snapshot_legible_siembra_solo_el_primero`: siembra el seed vigente SOLO en p_uno y verifica que p_dos no recibe carpeta; guard vigente de `ensure_seed` intacto (`load().is_ok()` nunca pisa datos). |
| REQ-28-08 | ✔ | R4 delega en `arranque_frio` (extraído reutilizable en `arranque_perfiles.rs` L36-56, mismo camino REQ-21-04/05). Tests: alta «Personal»+seed y adopción del legado con backup renombrado verificado. |
| REQ-28-09 | ✔ | Código: `recuperar` solo llama `guardar_registro` (escribe ÚNICAMENTE profiles.json) y `ensure_seed` (guard; escribe solo en la ruta del activo). Tests: `conservacion_datos_tests` compara snapshots de p_uno y p_dos **byte a byte** antes/después, 2 perfiles intactos, y `los_nombres_de_los_perfiles_ajenos_no_se_alteran` conserva nombres originales. |

## Reglas R1-R4 vs spec (verificación en código)

`application/recuperacion_arranque.rs` (62 líneas) implementa exactamente la
tabla §5.2 del análisis:

- **R1** (L28-37): activa presente en perfiles Y snapshot existe → `Ok(false)`, nada escrito.
- **R2** (L41-52): activa nula/huérfana/sin snapshot → primer perfil del array con snapshot (`find` sobre orden del registro, sin heurísticas) + persistencia vía `guardar_registro`.
- **R3** (L55-61): nadie con snapshot → activa = primero + `ensure_seed` con su guard vigente.
- **R4** (L24-26): registro sin perfiles → `arranque_frio` (flujo frío REQ-21-04/05 intacto, migración única y seed protegidos por sus tests preexistentes, todos en verde).

## TDD rojo→verde

El informe §2 documenta los 10 tests escritos ANTES del código con salida en
rojo y causa raíz correcta (`left: None` / «sin perfil activo»), manteniendo
295 tests preexistentes en verde durante el rojo. Los tests existen, ejercitan
el escenario del bug y hoy están en verde en mi propia ejecución. Evidencia
consistente y creíble. Los ajustes en 6 ficheros de test existentes son
mecánicos (`&mut`) sin cambio semántico.

## Arquitectura y convenciones

- Dominio puro: el grep da 0; incluso se reformuló un comentario de
  `domain/onboarding/mod.rs` que contenía la palabra literal.
- La query de puerto nueva `tiene_snapshot` mantiene el filesystem fuera de
  application (hexagonal correcto): la declara el trait, la implementa el
  adapter.
- Opción A (`&self`→`&mut self`) debidamente justificada frente a interior
  mutabilidad; propagación mecánica completa (impl real, 2 dobles, casos de
  uso, commands con binding `mut`). El puerto refleja honestamente su efecto.
- Errores nombrados en español («no se pudo leer/copiar/crear…», «sin perfil
  activo…»). Registro corrupto sigue bloqueando el arranque sin escribir nada
  (test preexistente `profiles_json_corrupto_produce_error_nombrado_sin_alterar_datos` en verde).
- Sin CSS en `.tsx` (no aplicable: no tocó frontend). Sin dependencias nuevas.
- Sin prints de debug, TODOs sin contexto ni archivos temporales sueltos.

## Incidencias encontradas

Ninguna bloqueante. Observaciones menores (no requieren cambios):

1. **Fallo intermitente único** reportado por el implementer en
   `ruta_del_command_activa_…`: en mi ejecución completa pasó en verde;
   atribución a contención puntual del filesystem razonable y correctamente
   documentada como transparencia.
2. `lib.rs` y `recuperacion_flujo_frio_tests.rs` quedan EXACTOS en 100 líneas:
   dentro del límite («no supera las 100»), pero sin margen para crecer.

## Checkpoints (CHECKPOINTS.md)

### Arquitectura hexagonal
- C1 dependencias hacia el dominio: [x]
- C2 puertos/adapters, invoke solo en adapters: [x]
- C3 sin CSS en .tsx: [x] (feature backend-only)
- C4 lógica fuera de UI/commands: [x] (recuperación en application/, commands finos)
- C5 tokens sin hardcodear: [x] (n/a, sin UI)
- C6 ≤100 líneas: [x]
- C7 sin dependencias sin aprobar: [x]

### Verificación
- C8 ./init.sh verde: [x]
- C9 cargo check compila: [x]
- C10 cargo test 100%: [x] (305/305)
- C11 app arranca sin errores (toca UI): [x] (n/a UI; la corrección ES el arranque sin ErrorScreen, cubierta por composition root real en test)

### Harness
- C12 feature_list.json en done: [ ] ← Esperado: se marcará done por el implementer TRAS este APPROVED, según protocolo.
- C13 progress/current.md al día: [x]
- C14 sin temporales/debug/TODOs: [x]

## Conclusión

Los 9 requisitos están cubiertos con evidencia verificada, la suite Rust está
305/305 en verde, `./init.sh` termina verde completo, el dominio sigue puro,
la autorecuperación jamás toca datos ajenos (verificado en código y en tests
byte a byte) y el test de reinicio contra el adapter REAL habría pillado el
bug original. Cumple arquitectura, convenciones y checkpoints aplicables.

**APPROVED.** El implementer puede marcar la feature 28 como `done`.
