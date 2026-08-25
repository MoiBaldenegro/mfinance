# Requisitos — rollback-perfil-vista (feature 38)

## Requisitos

REQ-38-01 WHEN el usuario inicia una selección desde una vista con un perfil activo, la aplicación SHALL capturar el id del perfil activo y el identificador de la sección o vista actual antes de confirmar el perfil nuevo.
REQ-38-02 WHILE la carga del snapshot seleccionado está en curso, la aplicación SHALL impedir el renderizado de AppShell y de cualquier sección financiera con datos del perfil anterior.
REQ-38-03 IF falla la carga del snapshot seleccionado, THEN la aplicación SHALL ejecutar una sola reversión explícita hacia el id de perfil capturado y marcar la operación original como fallida.
REQ-38-04 WHEN la reversión del perfil capturado termina correctamente, la aplicación SHALL cargar una vez su snapshot sin reutilizar el snapshot fallido ni datos del perfil nuevo.
REQ-38-05 WHEN la carga del snapshot anterior termina correctamente, la aplicación SHALL mostrar AppShell completa con el perfil capturado como activo visible y la navegación de la sección o vista capturada.
REQ-38-06 IF falla la reversión del perfil o la carga del snapshot anterior, THEN la aplicación SHALL mostrar ErrorScreen con el diagnóstico de la fase fallida y acciones explícitas «Reintentar» y «Gestionar perfiles».
REQ-38-07 WHILE ErrorScreen representa un fallo de reversión, la aplicación SHALL evitar reintentos automáticos y mantener ausentes AppShell y las secciones financieras.
REQ-38-08 WHEN el usuario activa «Reintentar» o «Gestionar perfiles» desde un fallo de reversión, la aplicación SHALL ejecutar únicamente la acción explícita solicitada sin reiniciar el rollback original ni cargar snapshots por el montaje de la gestión.
REQ-38-09 WHEN la carga del snapshot nuevo termina correctamente, la aplicación SHALL mostrar AppShell completa con el perfil nuevo y la sección o vista activa que corresponda.
