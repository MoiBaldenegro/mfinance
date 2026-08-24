# Requisitos — perfiles-ui-selector (feature 22)

## Requisitos

REQ-22-01 El frontend SHALL acceder a los perfiles mediante un puerto en src/domain/ports implementado por un adapter IPC bajo src/adapters.
REQ-22-02 La cabecera SHALL mostrar de forma permanente el nombre del titular del perfil activo.
REQ-22-03 WHEN el usuario selecciona otro perfil, la aplicación SHALL recargar el snapshot del perfil elegido y refrescar todas las secciones con sus datos.
REQ-22-04 La sección Ajustes SHALL permitir listar los perfiles crear uno nuevo con nombre y activar cualquiera de ellos.
REQ-22-05 IF el nombre del perfil nuevo está vacío o ya existe, THEN la UI SHALL mostrar el error en español junto al campo sin crear el perfil.
REQ-22-06 IF falla la carga del snapshot del perfil activo, THEN la aplicación SHALL mostrar un error nombrado en español sin mezclar datos de otros perfiles.
REQ-22-07 La moneda mostrada SHALL ser la del snapshot del perfil activo heredando el mecanismo de las features 19 y 20 sin lógica adicional.
