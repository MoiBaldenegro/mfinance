# Requisitos — regresar-ajustes-error-perfil (feature 37)

## Requisitos

REQ-37-01 IF falla la carga del snapshot después de seleccionar un perfil desde Ajustes, THEN la aplicación SHALL ofrecer una acción visible «Regresar a Ajustes» desde ErrorScreen.
REQ-37-02 WHEN el usuario activa «Regresar a Ajustes», la aplicación SHALL sustituir ErrorScreen por una pantalla de Ajustes centrada en la gestión de perfiles sin renderizar GestionPerfiles como contenido incrustado del error.
REQ-37-03 WHILE la pantalla de Ajustes de recuperación está visible, la aplicación SHALL mostrar la lista conservada por PerfilProvider con el perfil activo marcado y acciones para seleccionar otro perfil.
REQ-37-04 WHEN la aplicación vuelve a montar AppShell después de una carga válida, la navegación SHALL conservar la sección activa anterior, que en este flujo es Ajustes.
REQ-37-05 WHILE el snapshot seleccionado está cargando o su carga ha fallado, la aplicación SHALL impedir la renderización de secciones financieras con un snapshot anterior.
REQ-37-06 WHEN PerfilPort confirma una selección desde la pantalla de recuperación, la aplicación SHALL solicitar una única carga del snapshot correspondiente a esa selección.
REQ-37-07 IF PerfilPort rechaza una selección, THEN la pantalla de recuperación SHALL conservar el perfil activo visible y mostrar el error nombrado sin solicitar la carga de un snapshot.
REQ-37-08 WHEN el usuario entra en la pantalla de Ajustes de recuperación, la aplicación SHALL evitar una recarga automática del snapshot y reservar las recargas para una selección confirmada o una acción explícita de reintento.
