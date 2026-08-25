# Diseño — modal-error-carga-perfil (feature 39)

## Contexto visual

- **Estado actual:** `ejecutarCambioPerfil` inicia el rollback en la misma
  rama en la que falla el snapshot objetivo. `SnapshotProvider` desmonta
  `AppShell`, el rollback normalmente se completa y el aviso no alcanza a
  permanecer visible. `ErrorScreen` solo representa fallos del rollback o de
  otras cargas y muestra el diagnóstico como pantalla completa.
- **Estado deseado:** un fallo del perfil objetivo abre un diálogo persistente
  sobre una superficie segura sin shell ni datos financieros. El diálogo
  identifica el perfil, muestra una sola copia del error y ofrece «Volver al
  perfil anterior». Esa acción inicia el rollback de la feature 38; un cierre
  solo deja ErrorScreen/recuperación segura. Tras una recuperación válida,
  `AppShell` vuelve a la sección original.

## Tokens usados (solo de los tokens del diseño del proyecto)

| Token | Uso |
|---|---|
| `--color-bg` / `--color-surface` | Fondo seguro y superficie del diálogo. |
| `--color-border` | Borde y separación de la superficie modal. |
| `--color-text` / `--color-muted` | Título, nombre del perfil y contexto. |
| `--color-negative` / `--color-error-bg` | Diagnóstico del fallo y estado de riesgo. |
| `--color-primary` / `--color-primary-hover` / `--color-primary-contrast` | Acción primaria de rollback confirmado. |
| `--space-2..6` | Ritmo interno, separación de acciones y margen responsive. |
| `--radius-md` / `--sombra-md` | Forma y elevación del diálogo. |
| `--anillo-foco` / `--transicion-rapida` | Foco visible y estados interactivos. |

## Decisiones y constraints

- **Decisión 1:** extraer un componente de diálogo de fallo de perfil o una
  variante explícita de `ErrorScreen`, pero mantener una sola rama visual del
  diagnóstico. El diálogo no anida otro `role="alert"` que repita
  `error.message`.
- **Decisión 2:** usar un contenedor semántico con `role="dialog"` y
  `aria-modal="true"`, título y descripción enlazados, foco inicial,
  restauración de foco y cierre con Escape. El overlay bloquea la interacción
  exterior; no se añade una librería modal.
- **Decisión 3:** la acción primaria es inequívoca: «Volver al perfil
  anterior». Cerrar, Escape o una acción secundaria no seleccionan el perfil
  anterior ni reintentan; muestran una superficie segura con diagnóstico y
  gestión explícita, sin carga automática.
- **Decisión 4:** la vista original se conserva como `ContextoAnterior` y no
  como snapshot renderizable. Solo se restaura después de que el perfil
  anterior haya sido seleccionado y su snapshot validado/publicado por la
  transacción existente.
- **Decisión 5:** un fallo durante el rollback sigue usando `ErrorScreen` con
  fase y acciones explícitas. Ninguna ruta de error monta `AppShell`, una
  sección financiera o un snapshot antiguo.
- **Restricciones:** no añadir router, command, paquete ni crate; `invoke()`
  permanece en adapters; estilos fuera de `.tsx` y solo tokens; lógica de
  estado en el caso de uso/coordinador; cada archivo nuevo o modificado queda
  en 100 líneas o menos; textos en español.

## Alternativa descartada

- **Alternativa considerada:** mantener `AppShell` con el snapshot anterior
  detrás del modal o disparar el rollback al cerrarlo para que el usuario nunca
  vea una pantalla de error.
- **Motivo del descarte:** la shell puede asociar visualmente datos anteriores
  con una selección persistida nueva y el cierre automático reproduce el flash
  que origina el requerimiento. La salida segura sin datos, seguida de una
  confirmación explícita, mantiene el aislamiento y hace visible el motivo.
