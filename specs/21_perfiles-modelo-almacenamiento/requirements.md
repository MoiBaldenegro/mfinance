# Requisitos — perfiles-modelo-almacenamiento (feature 21)

## Requisitos

REQ-21-01 El backend SHALL mantener un registro de perfiles con id nombre y fecha de creación junto a un indicador del perfil activo.
REQ-21-02 Cada perfil SHALL almacenar su snapshot financiero completo en una ruta propia dentro de Documents/mfinance sin compartir archivos entre perfiles.
REQ-21-03 WHEN se invoca cualquier command de estado, el backend SHALL operar exclusivamente sobre el snapshot del perfil activo.
REQ-21-04 IF no existe profiles.json pero sí existe el mfinance.json legado, THEN el arranque SHALL crear el primer perfil copiando el legado a su ruta de perfil y conservando una copia de seguridad renombrada sin repetir la operación en arranques posteriores.
REQ-21-05 IF al arrancar no existe ningún perfil, THEN el sistema SHALL crear el perfil inicial sembrado con el seed vigente.
REQ-21-06 IF el nombre solicitado está vacío o duplicado o el registro de perfiles está corrupto, THEN el backend SHALL rechazar la operación con error nombrado sin alterar datos.
REQ-21-07 Los comprobantes PDF SHALL almacenarse bajo la ruta del perfil activo aislados del resto de perfiles.
REQ-21-08 Los commands listar_perfiles crear_perfil y seleccionar_perfil SHALL exponerse como handlers finos que delegan en application sin acceso directo al filesystem.
