# Análisis: el gate vuelve al paso 1 después de finalizar el onboarding

Fecha: 2026-08-24 · Autor: spec_author · Estado: análisis completo, pendiente de implementación

## 1. Problema y alcance

El reporte significa que la operación de finalizar (o saltar) sí parece
terminar, pero la decisión posterior de arranque/recarga vuelve a montar el
wizard en su paso inicial. Como el `AppShell` nunca llega a mostrarse, el
alcance mínimo es reparar el contrato de datos del estado de onboarding entre
Rust, IPC y TypeScript. No hace falta rediseñar el wizard, modificar seed ni
crear otro command.

## 2. Flujo real verificado

### Carga inicial y gate

1. `src-tauri/src/lib.rs` construye `JsonSnapshotRepository`, ejecuta
   `application::arranque_perfiles::preparar_arranque` y registra el command
   `obtener_perfil_activo_con_onboarding`.
2. En un arranque frío se crea el perfil `Personal` con estado
   `NotStarted`; tras la feature 30 no se crea todavía el snapshot. En un
   arranque posterior `recuperar` restaura el perfil activo y deja el repo
   preparado para cargar su snapshot.
3. `src/components/shell/SnapshotProvider.tsx` llama a
   `snapshotPort.obtenerPerfilActivoConOnboarding()`. La respuesta contiene
   `snapshot` y `onboarding_status`; el gate evalúa
   `resultado.onboarding_status.nombre === 'Completed'`. Si la expresión es
   verdadera publica estado `listo`; si no, publica `onboarding`.
4. `src/App.tsx` muestra `AppShell` solo para el estado `listo` y monta
   `OnboardingWizard` para el estado `onboarding`.

### Finalizar

1. En el paso 5, `OnboardingWizard.manejarSiguiente` llama a
   `useOnboarding().completar()`.
2. El hook hace `flush` de la persistencia parcial y delega en el caso de uso
   `completarOnboarding`.
3. `src/adapters/onboarding-adapter.ts` invoca `completar_onboarding` con
   `perfilId` en camelCase.
4. `src-tauri/src/commands/perfiles_onboarding_commands.rs` delega en
   `completar_onboarding_en_adaptador`: selecciona el perfil, marca
   `onboarding_status = Completed`, guarda `profiles.json`, consolida los
   datos en el snapshot del perfil y lo guarda.
5. Si la respuesta es OK, `OnboardingWizard` ejecuta `alCompletar`; en
   `App.tsx` ese callback llama a `SnapshotProvider.completarOnboarding()`.
   Este incrementa `intento`, relanza la carga combinada y debería terminar en
   `AppShell` con el snapshot recién persistido.

### Saltar

`manejarSaltar` sigue la misma transición externa. El caso
`saltarOnboarding` primero envía datos mínimos (`nombre`, `MXN`, una fuente y
una categoría) y después invoca `completar_onboarding`; el backend deja el
perfil en `Completed` y consolida el snapshot. El callback `alSaltar` también
relanza la carga del `SnapshotProvider`.

## 3. Causa raíz

El enum Rust no tiene la misma forma JSON que el tipo TypeScript:

```rust
#[serde(rename_all = "PascalCase")]
enum OnboardingStatus {
    NotStarted,
    InProgress { current_step: u8 },
    Completed,
}
```

La serialización serde externa resultante es:

- `NotStarted` → la cadena JSON `"NotStarted"`.
- `Completed` → la cadena JSON `"Completed"`.
- `InProgress { current_step: 3 }` →
  `{ "InProgress": { "current_step": 3 } }`.

En cambio, `src/domain/entities/onboarding/onboarding-status.ts` y todo el
frontend consumen:

- `{ nombre: 'NotStarted' }`.
- `{ nombre: 'Completed' }`.
- `{ nombre: 'InProgress', current_step: 3 }`.

Por tanto, después de finalizar el backend devuelve correctamente el estado
`Completed`, pero el gate lee una cadena y obtiene
`resultado.onboarding_status.nombre === undefined`. El `SnapshotProvider`
elige la rama `onboarding`, no la `listo`; al montarse de nuevo el wizard
calcula `currentStep` como 1 porque `useOnboarding` también depende de
`status.nombre`. Esto explica exactamente «regresar al paso uno» y que nunca
inicie la aplicación.

La misma incompatibilidad afecta a `PerfilFila.tsx` (badge/reanudación) y a
`use-onboarding.ts`, aunque no es necesario que esos síntomas aparezcan para
reproducir el bloqueo. La recarga del snapshot no es la causa primaria: la
recarga se dispara, y la persistencia del perfil se ejecuta; falla la
interpretación del estado que decide el gate.

## 4. Por qué la suite actual no lo detecta

- Los tests Rust verifican valores del enum y round-trip Rust, pero no fijan
  el JSON que cruza el command IPC.
- Los doubles de `tests/onboarding-wizard/` fabrican manualmente objetos con
  `{ nombre: ... }`, por lo que ocultan la forma serde real.
- `tests/onboarding-auto-gate/auto-gate-startup.test.mjs` solo inspecciona
  texto y regex; no monta React ni prueba una respuesta IPC
  `"Completed"`.
- La feature 31 corrigió las claves de argumentos camelCase (`perfilId`),
  pero ese arreglo no corrige la serialización de valores de respuesta.

## 5. Capas, datos, repositorios y rutas afectadas

- **Dominio backend:** `src-tauri/src/domain/onboarding/status.rs`; define el
  contrato serializable de `OnboardingStatus`.
- **Persistencia:** `profiles.json` almacena el estado dentro de cada `Perfil`;
  perfiles existentes pueden contener la forma serde anterior. La lectura
  debe seguir aceptando esa forma para no romper usuarios ya creados.
- **Commands/application:**
  `src-tauri/src/application/obtener_perfil_activo_con_onboarding.rs` y
  `src-tauri/src/commands/obtener_perfil_activo_con_onboarding_commands.rs`
  exponen el estado en la carga combinada; los commands de onboarding devuelven
  y persisten el mismo enum.
- **Frontend dominio:**
  `src/domain/entities/onboarding/onboarding-status.ts` ya define la forma
  canónica esperada y no necesita conocer Tauri.
- **Frontend adapter/gate/UI:**
  `src/adapters/snapshot-ipc-adapter.ts`,
  `src/adapters/onboarding-adapter.ts`, `src/components/shell/SnapshotProvider.tsx`,
  `src/App.tsx`, `src/hooks/use-onboarding.ts` y `src/components/ajustes-section/PerfilFila.tsx`
  consumen el discriminador `nombre`. El cambio mínimo puede conservarlos
  intactos si Rust emite la forma canónica.

## 6. Alcance mínimo recomendado

1. Definir una representación JSON canónica de objeto con discriminador
   `nombre`, exactamente compatible con el tipo TypeScript.
2. Hacer que Rust emita esa representación tanto para `Completed`/`NotStarted`
   como para `InProgress` y que deserialice también la representación externa
   antigua de perfiles ya persistidos.
3. Añadir tests de contrato sobre los tres estados y sobre la compatibilidad
   de lectura; añadir una prueba de regresión del gate que demuestre que una
   respuesta `Completed` permite el estado `listo` y que la finalización/salto
   recarga el snapshot una sola vez con el estado correcto.

No se requieren paquetes nuevos, cambios en `src/` de producción, cambios en
`tests/` durante esta sesión, ni `design.md`: la feature propuesta corrige el
contrato de serialización y conserva el marcado/presentación existentes.

## 7. Riesgos y dependencias

- Cambiar solo la serialización sin un deserializador compatible podría dejar
  inutilizables `profiles.json` de instalaciones anteriores; es obligatorio
  cubrir ambas formas de entrada.
- Un normalizador aislado únicamente en `SnapshotProvider` dejaría rotos el
  reanudar, el badge de Ajustes y `useOnboarding`; por eso se recomienda
  corregir el contrato en su origen.
- No hay dependencia externa ni decisión humana pendiente. La feature debe
  ejecutarse después de la feature 29, que introdujo el gate que queda bloqueado
  por esta incompatibilidad; la feature 31 es antecedente histórico de los
  argumentos IPC, pero no es dependencia técnica directa de este arreglo.

## 8. Conclusión

La finalización y el salto sí escriben `Completed` y la recarga sí se inicia.
El fallo está en el contrato wire de `OnboardingStatus`: Rust envía enums
serde externamente etiquetados y TypeScript espera un objeto con `nombre`. Al
alinear la serialización y mantener lectura retrocompatible, el gate podrá
reconocer `Completed`, abandonar el wizard en el paso que se ve como 1 y
mostrar `AppShell` sin tocar la lógica financiera ni la experiencia visual.
