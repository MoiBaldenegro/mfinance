# Requisitos — recuperacion-error-perfil (feature 36)

## Requisitos

REQ-36-01 IF falla la carga del snapshot del perfil activo, THEN ErrorScreen SHALL mostrar el error nombrado y una acción visible «Gestionar perfiles».
REQ-36-02 WHEN el usuario activa «Gestionar perfiles», la aplicación SHALL mostrar la gestión existente con la lista de perfiles y el perfil activo marcado mientras conserva visible el título y el motivo del error.
REQ-36-03 WHILE la gestión de perfiles se muestra desde un error de carga, la aplicación SHALL evitar renderizar secciones con un snapshot anterior y mantener disponible «Reintentar».
REQ-36-04 WHEN el usuario selecciona otro perfil desde la gestión de recuperación, la aplicación SHALL confirmar la selección mediante PerfilPort y solicitar la carga de su snapshot sin limpiar previamente el registro del perfil activo.
REQ-36-05 IF falla la carga del snapshot recién seleccionado, THEN la aplicación SHALL conservar ErrorScreen con el nuevo motivo y una acción disponible para gestionar perfiles.
REQ-36-06 WHEN la carga del snapshot recién seleccionado termina correctamente, la aplicación SHALL mostrar AppShell con ese snapshot y el nombre de su perfil activo.
REQ-36-07 IF falla el command de selección del perfil, THEN la gestión SHALL mostrar un error nombrado en español sin cambiar el perfil activo visible ni solicitar una carga de snapshot.
