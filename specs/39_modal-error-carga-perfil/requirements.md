# Requisitos — modal-error-carga-perfil (feature 39)

## Requisitos

REQ-39-01 WHEN la carga del snapshot del perfil objetivo falla después de seleccionar ese perfil, la aplicación SHALL conservar el id del perfil y la sección o vista anteriores y presentar un diálogo persistente que identifique el perfil objetivo y muestre el motivo de carga.
REQ-39-02 WHILE el diálogo de fallo del perfil objetivo está abierto, la aplicación SHALL mantener ausentes AppShell y todas las secciones financieras y evitar la publicación del snapshot fallido o de datos financieros bajo un titular equivocado.
REQ-39-03 WHILE el diálogo de fallo del perfil objetivo está abierto, la aplicación SHALL abstenerse de iniciar el rollback del perfil anterior y de reintentar automáticamente la selección o la carga.
REQ-39-04 WHEN el usuario activa «Volver al perfil anterior», la aplicación SHALL iniciar una sola vez el rollback completo existente usando el id y la vista capturados antes de la selección objetivo.
REQ-39-05 WHEN el rollback confirma el perfil anterior y carga su snapshot correctamente, la aplicación SHALL mostrar AppShell completa con el perfil y la sección o vista capturados.
REQ-39-06 WHEN el usuario cierra o cancela el diálogo, la aplicación SHALL mostrar una salida segura sin AppShell ni secciones financieras que conserve el diagnóstico y ofrezca acciones explícitas de recuperación sin cargar un snapshot por el mero montaje.
REQ-39-07 WHILE el diálogo está visible, el diálogo SHALL exponer role="dialog", aria-modal="true", relaciones aria-labelledby y aria-describedby, foco de teclado gestionado y cierre mediante Escape o un control accesible.
REQ-39-08 WHEN el diálogo o su salida segura muestra el motivo del fallo, la interfaz SHALL renderizar el texto de error una sola vez en cada estado visible sin anidar copias del mensaje normalizado.
REQ-39-09 IF falla la selección o la carga durante el rollback confirmado, THEN la aplicación SHALL mantener ausentes AppShell y las secciones financieras y mostrar ErrorScreen con la fase, el motivo y acciones explícitas de recuperación.
REQ-39-10 La presentación del diálogo SHALL consumir únicamente tokens existentes y respetar los límites estructurales del proyecto sin añadir dependencias.
