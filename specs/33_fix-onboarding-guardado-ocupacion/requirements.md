# Requisitos — fix-onboarding-guardado-ocupacion (feature 33)

REQ-33-01 WHEN el usuario edita un campo de cualquier paso del wizard, el hook useOnboarding SHALL actualizar el estado local sin activar el indicador de ocupación durante la ventana de debounce.
REQ-33-02 WHEN la ventana de debounce expira, el hook SHALL enviar exactamente un comando actualizar_perfil_onboarding con los últimos datos acumulados manteniendo el indicador de ocupación activo únicamente mientras ese envío está en vuelo.
REQ-33-03 WHILE solo haya persistencia parcial pendiente o en vuelo, el wizard SHALL mantener habilitados los inputs del paso activo.
REQ-33-04 WHEN el usuario pulsa Siguiente Atrás Finalizar onboarding o Saltar onboarding, el hook SHALL ejecutar el flush del guardado pendiente restableciendo el indicador de ocupación al terminar, WHERE no exista guardado pendiente o el flush falle.
REQ-33-05 IF un envío de persistencia parcial termina en error, THEN el hook SHALL conservar los datos locales editados restablecer el indicador de ocupación y registrar el fallo sin bloquear la edición.
REQ-33-06 El hook SHALL agrupar todas las ediciones de una ráfaga en un único envío tras DEBOUNCE_MS 500 ms sin emitir una llamada IPC por pulsación.
