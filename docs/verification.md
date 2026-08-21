# Verificación — Cómo comprobar que el trabajo funciona

> Antes de declarar cualquier tarea como `done`, pasa por esta lista.
> La puerta de entrada es SIEMPRE `./init.sh`.

## 1. Entorno y formato (siempre)

```
./init.sh
```

Comprueba, en orden:

1. Herramientas disponibles (node, pnpm) y dependencias instaladas (`node_modules`).
2. Existencia de los archivos del harness (`AGENTS.md`, `feature_list.json`,
   `progress/current.md`).
3. Formato correcto de `feature_list.json`, `progress/current.md`, specs EARS
   y registro de dependencias (`scripts/check-format.mjs`, que integra la
   validación de `specs/<NN>_<name>/requirements.md` de toda feature no-done
   y de `docs/dependencies.md` contra package.json vía
   `scripts/validate-dependencies.mjs`).
4. Tests automáticos al 100% (`pnpm test`, node:test).
5. Build de producción (`pnpm build`).

Resultado:

- Todo verde → `El entorno está perfecto. Podemos empezar a trabajar.`
- Cualquier fallo → reporta exactamente qué falla y **no se debe continuar**
  hasta resolverlo.

### Si falta `feature_list.json` en la comprobación de entorno

La comprobación 2 (existencia de los archivos del harness) usa
`test -f feature_list.json`: si la ausencia señala el archivo, **detén** el
flujo y aplica la **única recuperación**: **crear un nuevo**
`feature_list.json` **desde cero** con el esqueleto mínimo del backlog según
el formato del validador (`project`, `description`, `rules`, `features`).

La regeneración es **limpia**: el array `features` se rellena **solo con las
features nuevas** del ciclo (pendientes o en trabajo) y **no re-crea** el
histórico de features ya cerradas. El estado resultante NO contiene features
done: el historial de features cerradas vive únicamente en
`progress/history.md` y en los artefactos permanentes (`specs/<NN>_*`,
`progress/impl_*.md`, `progress/review_*.md`, `progress/research/`). La
numeración de ids **arranca en 1** para las features nuevas del ciclo
regenerado. Las features nuevas se dan de alta vía `spec_author`. El archivo
nunca se recupera desde git; se crea uno nuevo en cualquier caso. Vuelve a
ejecutar `./init.sh` cuando el nuevo backlog exista.

### Política de estado del backlog

En el **estado normal** de funcionamiento el array `features` de
`feature_list.json` **conserva las features `done`**: al cerrar una feature
aprobada el implementer la marca `status: "done"` y la feature **permanece en
el array**, conviviendo con las `pending` e `in_progress`. Ningún agente
elimina features del array por su cuenta.

El array solo puede quedar vacío (`features: []`) por **ausencia** del archivo
o por **limpieza manual** humana, en dos casos justificados:

1. **Ausencia del archivo**: `feature_list.json` no existe y se regenera
   limpio (ver la subsección anterior; el esqueleto se rellena solo con
   features nuevas).
2. **Limpieza manual humana**: el humano pide explícitamente limpiar el
   historial («limpia el historial») y el líder dispara la operación que vacía
   las features `done` **tras dejar antes el historial** en
   `progress/history.md`.

Cualquier vaciado del array que no responda a esos dos casos es un
**vaciado automático no justificado** y el `./init.sh` (candado del kit:
`tests/harness-kit-integrity.test.mjs`) lo rechaza.

## 2. Regresión visual (si tocas UI)

- `pnpm dev --background`, abre `localhost:4321` y revisa la página.
- Responsive: prueba el ancho de 768px.
- Verifica en `astro dev logs` que no hay errores.

## 3. Convenciones

- `docs/architecture.md` §7 y `docs/conventions.md` (estilos fuera del `.astro`,
  lógica en `.ts`, tokens, ≤100 líneas por archivo, datos vía repositorio).
- La implementación es coherente con su spec `specs/<NN>_<name>/requirements.md`
  (y `design.md` si existe) y con la estructura `specs/` de
  `docs/conventions.md`.

## 4. Estado del harness

- `feature_list.json` refleja el estado real de la tarea.
- **Test-first (TDD):** los tests se escriben contra la spec (`design.md` si
  existe) ANTES del código y se observan en rojo antes de implementar; el
  informe `progress/impl_<feature>.md` incluye la evidencia del ciclo
  rojo/verde (salida del test en rojo y de la suite en verde).
- El reviewer valida la implementación contra `specs/<NN>_<name>/requirements.md`
  (`design.md` si existe) y la coherencia entre los `acceptance` de
  `feature_list.json` y los REQ de la spec (trazabilidad acceptance↔REQ).
- `progress/current.md` documenta la sesión.
- `progress/history.md` recibe el resumen al cerrar.
- **Ninguna tarea se da por cerrada** sin `progress/review_<feature>.md`
  con veredicto `APPROVED` (lo lanza el líder, nunca el implementer).
- **Dependencias**: ningún agente aprueba dependencias (la aprobación es
  decisión exclusiva del humano tras discusión); si una feature necesita una
  dependencia nueva, se marca `blocked` y la aprobación se materializa en
  `docs/dependencies.md`, validada por `scripts/validate-dependencies.mjs`.
