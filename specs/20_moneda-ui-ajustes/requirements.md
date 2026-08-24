# Requisitos — moneda-ui-ajustes (feature 20)

## Requisitos

REQ-20-01 La sección Ajustes SHALL ofrecer un selector con las tres monedas del catálogo etiquetadas en español que persista la elección en la estrategia del snapshot activo.
REQ-20-02 WHEN el usuario cambia la moneda en Ajustes, la aplicación SHALL reformatear al instante todos los importes visibles de toda la interfaz.
REQ-20-03 WHEN la aplicación arranca, cada sección SHALL formatear sus importes con la moneda del snapshot cargado mediante el núcleo único de formateo.
REQ-20-04 Los componentes y casos de uso de presentación SHALL obtener símbolo y separadores exclusivamente del catálogo de monedas sin literales € ni es-ES embebidos.
REQ-20-05 Los campos de importe y las cabeceras de tablas SHALL mostrar el símbolo de la moneda activa en lugar del euro fijo.
REQ-20-06 IF el snapshot cargado procede de una versión anterior sin moneda, THEN la aplicación SHALL mostrar pesos mexicanos aplicando el defecto del modelo.
