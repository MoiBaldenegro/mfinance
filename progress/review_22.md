# Review — feature 22 (perfiles-ui-selector)

**Veredicto: CHANGES_REQUESTED**

Reviewer externo, 2026-08-23. Todo verificado CONTRA DISCO hoy por mí (no de
oídas): suites re-ejecutadas, greps propios, wc -l propio, lectura completa
de los módulos nuevos front/back y de las suites de `tests/perfiles-ui/`.

## Suites ejecutadas por mí hoy

| Suite | Resultado |
|---|---|
| `pnpm test` | **357/357 pass, 0 fail** (incluye las 24 de `tests/perfiles-ui/`) |
| `cargo test --manifest-path src-tauri/Cargo.toml` | **264 passed, 0 failed** |
| `cargo check --manifest-path src-tauri/Cargo.toml` | Finished, sin errores ni warnings |
| `./init.sh` | **Verde completo**: herramientas · harness · formato · tests 100% · build → «El entorno está perfecto» |
| `node scripts/audit-design-tokens.mjs` | AUDIT ✔ |

## Checklist criterio por criterio (acceptance F22 ↔ REQ spec)

1. **TDD rojo→verde del caso de uso de cambio (REQ-22-02/03)** — ✅
   - Test exigido existe y es el correcto: `tests/perfiles-ui/cambiar-perfil.test.mjs:32-50`
     verifica con PUERTO FALSO el orden exacto seleccionar → fijar titular
     (`alConfirmar`) → recarga ×1 (`alRecargar`), y :52-60 la recarga única;
     :63-80 que un fallo nombrado NO toca titular ni recarga (`tocados == []`).
   - Evidencia ROJO plausible y concreta en `progress/impl_22.md` §1: los tres
     módulos de use-cases no existían (`ERR_MODULE_NOT_FOUND`) y cargo falló con
     `unresolved import crate::application::perfiles::activo`. Los conteos VERDE
     del informe (357 node / 264 cargo) cuadran con lo que yo medí hoy.
2. **Puerto en domain/ports + adapter único con invoke (REQ-22-01)** — ✅
   - `src/domain/ports/perfil-port.ts` (17 l.): interfaz pura `listar/activo/crear/seleccionar`.
   - `src/adapters/perfil-ipc-adapter.ts` (42 l.): ÚNICO invoke nuevo, los 4 commands.
   - Mis greps HOY: `invoke(` bajo `src/` fuera de `src/adapters/` → **0 resultados**;
     imports de `react`/`@tauri-apps` bajo `src/domain/` → **0 resultados**;
     `@tauri-apps` solo en los 5 adapters existentes.
   - Pureza dominio Rust intacta: `application/perfiles.rs:21-33` (`activo`) usa SOLO
     el puerto (`cargar_registro`), sin fs ni tauri.
3. **Ajustes: lista con activo + crear por nombre; vacío/duplicado → mensaje
   español junto al campo SIN crear (REQ-22-04/05)** — ✅
   - `src/components/ajustes-section/GestionPerfiles.tsx`: lista :48-78 con marca
     «· activo», botón Activar por fila no activa, formulario :80-91, avisos junto
     al campo con `role="alert"` :92-94. Renderiza y delega (cero lógica propia).
   - Validación ANTES del puerto: `src/domain/use-cases/crear-perfil.ts:30-36`;
     test con puerto falso `crear-perfil.test.mjs:29-46`: `''`/`'   '` y duplicado
     local ⇒ `puerto.creados` permanece VACÍO. Mensajes idénticos al backend
     (`AVISO_NOMBRE_VACIO` ≡ `perfil_errors.rs:40`; `avisoNombreDuplicado` ≡ :43).
4. **Cabecera con titular permanente que cambia al seleccionar (REQ-22-02)** — ✅
   - `HeaderBar.tsx:18` renderiza `Perfil: {titular}` siempre (fallback «…»),
     consumiendo `usarPerfiles()`; el valor llega de backend tras cada remontaje
     (`AppShell.tsx:58-71` refresca registro al montar).
5. **Fallo de carga del snapshot → error nombrado español sin mezclar datos
   (REQ-22-06)** — ✅
   - Camino verificado: `SnapshotProvider.tsx:53-55` pone estado `error` y
     `App.tsx:22-24` muestra `ErrorScreen` con Reintentar; mientras tanto
     `AppShell` está DESMONTADO (`App.tsx:21`), así que ninguna sección pinta
     datos del perfil anterior. Tests de fallo en `cambiar-perfil.test.mjs:63-92`.
6. **Moneda = snapshot del activo sin lógica extra; estilos solo tokens;
   ≤100 líneas; ./init.sh verde (REQ-22-07)** — ❌ PARCIAL
   - Moneda ✅: `AppShell.tsx:80` `monedaDeSnapshot(snapshot)` literal heredado de
     f20, cero lógica añadida; el remontaje re-deriva la moneda del snapshot nuevo.
   - Tokens ✅: audit OK; grep propio de hex/rgb en las dos hojas nuevas → 0; los
     11 tokens usados existen todos en `tokens.css` (verificados uno a uno).
   - `./init.sh` ✅ verde completo (ejecutado por mí).
   - **≤100 líneas ✗**: `tests/harness-kit-integrity.test.mjs` — archivo MODIFICADO
     en este ciclo — mide **107 líneas** (detalle en Incidencia 1).

## Aislamiento de datos entre perfiles (análisis propio)

Cadena verificada sin huecos: `Activar` → `cambiarPerfil`
(`use-cases/cambiar-perfil.ts:27-39`) llama `seleccionar_perfil` IPC, que
persiste `registro.activa` en profiles.json (`application/perfiles.rs:57-73`)
y sincroniza la sesión de comprobantes (`commands/perfiles_commands.rs:61,
67-79`). Solo tras el éxito se dispara `recargar()` (`SnapshotProvider.tsx:62`),
que fuerza estado «cargando» → desmonte de `AppShell` → `load_state` lee vía
`JsonSnapshotRepository`, que resuelve la ruta según el activo NUEVO
(mecanismo aprobado en review_21). Si la carga falla: ErrorScreen nombrada,
app sin renderizar datos viejos. Ante fallo de SELECCIÓN no se toca titular ni
recarga (testeado). La moneda se re-deriva del snapshot nuevo en el remontaje.
**No encontré ningún camino por el que dos perfiles mezclen datos.**

Dependencias de la feature (protocolo): F22 `depends_on: [21]` → F21 `done`
en `feature_list.json` (línea 387). No se saltó ninguna dependencia. F22 sigue
`in_progress` (correcto: el `done` lo decide el líder tras el veredicto).

## Checkpoints (CHECKPOINTS.md)

- C1: [x] Dependencias hacia el dominio en ambos lados (greps 0/0 ejecutados por mí).
- C2: [x] Puertos definidos por el núcleo e implementados por adapters; invoke SOLO bajo src/adapters.
- C3: [x] Sin CSS en .tsx (hojas importadas desde src/styles); sin lógica de negocio en UI ni commands (handlers finos).
- C4: [x] Tokens únicamente (audit OK + verificación manual de los 11 tokens usados).
- C5: [ ] Ningún archivo TOCADO supera 100 líneas — FALLA: harness-kit-integrity.test.mjs = 107.
- C6: [x] Sin dependencias nuevas: package.json/Cargo.toml sin altas; docs/dependencies.md intacto (últimas aprobaciones humanas 2026-08-21/22).
- C7: [x] ./init.sh verde completo; cargo check/test limpios (ejecutados hoy por mí). El arranque GUI (`pnpm tauri dev`) no es verificable en este entorno headless; constato la auto-evaluación del implementer en CHECKPOINTS.md.
- C8: [x] Sin temporales ni debug (grep console.log/dbg!/TODO/FIXME en los archivos de F22 = 0).
- Harness: `[ ]` «tarea en done» NO aplica aún — es lo que habilitará la resolución de esta ronda; el líder marca `done`.

## Incidencias (con archivo/línea y corrección concreta)

1. **BLOQUEANTE — `tests/harness-kit-integrity.test.mjs` mide 107 líneas (>100).**
   Archivo modificado EN ESTE CICLO según `progress/impl_22.md` §0 y plan (0) de
   `progress/current.md` (+7 netas: comentario de 3 líneas en :74-76 y bloque
   `patrones` :77-80 sobre una base de 100 exactas). La corrección del falso
   positivo («hero» dentro de «ficheros») es CORRECTA y necesaria — semántica
   preservada para los 4 tokens actuales, bien documentada — pero infringe la regla
   dura de ≤100 líneas para archivos tocados (precedente aplicado igual en
   review_19/20/21; review_21.md:174). Corrección concreta (elige una):
   a) Compactar dentro del mismo archivo hasta ≤100 manteniendo semántica, p. ej.:
      comentario reducido a 1 línea, helper de escape en línea y cuerpo del map en
      una sola expresión, y aserción compactada a una línea — son −7 líneas
      alcanzables sin perder cobertura ni legibilidad; o
   b) Dividir en dos archivos de test coherentes (p. ej. integridad de archivos vs
      fuga de tokens), dejando ambos ≤100.
   NO se pide revertir el matching por límites de palabra: se pide cumplir el
   límite. Nota técnica menor (no bloqueante): los 4 tokens actuales empiezan y
   terminan con carácter de palabra, así que `\b...\b` es correcto hoy; si mañana
   un token arrancara/terminara en `-` o `_`, el patrón necesitará revisión.
2. **BLOQUEANTE (documentación) — afirmaciones inexactas en `progress/impl_22.md`.**
   §4 fila C6 dice «wc -l máx = 100 (gestion-perfiles.css)» y §6 dice «ningún
   archivo >100 líneas (wc -l en §5/§2)»: ambas falsas contra disco (107 en el
   kit-test) y además remiten a una tabla §5 de conteos que no existe (§5 es
   Decisiones; las tablas de §2 omiten el kit-test). Corrección: tras aplicar la
   Incidencia 1, actualizar §4/§6 con los conteos reales de TODOS los archivos
   creados/modificados, incluido el kit-test.
3. **Observación menor (sin acción requerida):** `CHECKPOINTS.md` perdió el salto
   de línea final (diff `\ No newline at end of file`); cosmético.

## Lo que SÍ está aprobable y no debe regresarse

Backend aditivo mínimo (`perfiles::activo`, command fino `perfil_activo`,
registro en lib.rs, 3 tests contra doble en memoria), frontend hexagonal completo
(entidad espejo, 5 errores nombrados con mapeo por `CommandError.codigo`, puerto,
adapter único, 3 use-cases, hook contexto), UI (GestionPerfiles, indicador en
HeaderBar, proveedor único en AppShell), hojas solo-tokens, suites 357+264 en
verde, init.sh verde, sin deps nuevas, TDD rojo→verde documentado. El único
desvío objetivo es el de las Incidencias 1-2.

## Conclusión

Cinco de los seis criterios de aceptación están cumplidos y verificados contra
disco hoy. El sexto falla por el límite de 100 líneas en un archivo tocado este
ciclo (107) y por las afirmaciones de conteo inexactas del informe. Al tratarse
de regla dura de la casa con precedente uniforme en reviews 19-21, no puedo
aprobar: corresponde ronda de corrección barata y acotada.

**VEREDICTO: CHANGES_REQUESTED**

---

# Ronda 2 — verificación

Reviewer externo, 2026-08-23. Revisión de la respuesta del implementer a las
Incidencias 1 y 2 de esta misma review. Todo re-verificado CONTRA DISCO hoy.

## Checklist de la ronda 2

1. **Informe §8 «Ronda 2 — cambios aplicados» leído** — ✅ existe en
   `progress/impl_22.md:157-239` y describe con exactitud lo que hay en disco
   (incluido el ajuste adicional de la autoexclusión de `progress/`,
   documentado con su motivación y coste de líneas).
2. **Límite ≤100 en disco** — ✅ `wc -l tests/harness-kit-integrity.test.mjs`
   ejecutado por mí = **99 líneas** (era 107). No hubo división (se aplicó la
   opción (a) de compacción); no existen archivos derivados nuevos. El resto
   de archivos tocados por F22 conserva sus conteos de la ronda 1; máximo
   global = 100 exactas (`gestion-perfiles.css`, dentro del límite).
3. **Cobertura NO perdida** — ✅ comparación línea a línea contra la versión
   que auditó en ronda 1:
   - Los 3 tests conservan nombre, lógica y MENSAJES idénticos
     (`harness-kit-integrity.test.mjs:66-71` obligatorios,
     `:73-84` fuga de tokens, `:86-99` template con 1 feature);
     solo se compactaron a una línea aserciones y comentario.
   - `FORBIDDEN_TOKENS` intacta (4 tokens, línea 41);
     `OBLIGATORY_FILES` intacta (28 entradas);
     matching por límites de palabra con escape e insensibilidad a caja
     CONSERVADO (línea 75) — no se revirtió, como exigí.
   - Único delta semántico: `if (entry.name === 'progress') continue;`
     (línea 54) excluye la bitácora del barrido anti-fuga. Lo VALIDO como
     correcto: es extensión del precedente de autoexclusión del propio test
     (los informes impl_*/review_* citan tokens legítimamente como EVIDENCIA;
     el falso positivo original nació precisamente en `progress/review_21.md`),
     evita tocar artefactos permanentes ajenos y está documentado en §8.
     Comprobación propia de que no enmascara nada REAL hoy: grep mío de los
     4 tokens sobre TODO el repo excepto `progress/` y el propio test →
     **0 resultados**; la superficie barrida sigue genuinamente limpia.
4. **Nada más tocado** — ✅ barrido mtime (`find … -newer progress/review_22.md`)
   sobre src/, src-tauri/src/, docs/, scripts/, feature_list.json,
   package.json, Cargo.toml y CHECKPOINTS.md: único resultado
   `tests/harness-kit-integrity.test.mjs`; en `progress/`, solo el esperado
   `progress/impl_22.md`. Cero cambios en código de la feature, specs ni
   feature_list.json (F22 sigue `in_progress`, correcto).
5. **Suites re-ejecutadas por mí HOY** — ✅
   | Suite | Resultado |
   |---|---|
   | `pnpm test` | **357/357 pass, 0 fail** |
   | `cargo test --manifest-path src-tauri/Cargo.toml` | **264 passed, 0 failed** |
   | `./init.sh` | **Verde completo**, incluido build («El entorno está perfecto») |

## Resolución de las incidencias de la ronda 1

- **Incidencia 1 (kit-test 107 > 100): RESUELTA** — 99 líneas en disco,
  semántica y mensajes íntegros.
- **Incidencia 2 (cifras inexactas del informe): RESUELTA** — fila C6 de §4
  (`impl_22.md:118`) y §6 (`:146-150`) ahora reflejan los wc -l reales
  («kit-test corregido a 99 en ronda 2», máximo global 100) y remiten a la
  tabla completa de §8; la remisión errónea a una «tabla §5» inexistente fue
  eliminada. Tabla §8 cotejada contra mis mediciones de ronda 1: coincide.
- Observación 3 (salto de línea final de CHECKPOINTS.md): sin acción, según
  lo declarado en ronda 1.

## Conclusión ronda 2

Los dos cambios requeridos están aplicados exactamente como pedí, sin pérdida
de cobertura, sin tocarse nada más y con las tres suites en verde ejecutadas
por mí hoy. La feature 22 cumple sus seis criterios de aceptación, la
arquitectura hexagonal, las convenciones y los checkpoints aplicables.

**VEREDICTO RONDA 2: APPROVED**
