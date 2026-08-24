# Requisitos — 31 fix-onboarding-status-perfilid

## Requisitos

REQ-31-01 El adapter Tauri IPC de onboarding SHALL enviar el identificador de perfil bajo la clave camelCase perfilId en los commands obtener_onboarding_status actualizar_perfil_onboarding completar_onboarding agregar_meta actualizar_meta y eliminar_meta.
REQ-31-02 WHEN el adapter invoca actualizar_meta o eliminar_meta, el adapter SHALL enviar el identificador de la meta bajo la clave camelCase metaId.
REQ-31-03 WHEN la app arranca con un perfil activo cuyo onboarding está NotStarted o InProgress, el wizard de onboarding SHALL cargar su estado actual sin rechazo de Tauri por claves de argumento ausentes.
REQ-31-04 El wizard de onboarding SHALL guardar datos parciales completar y saltar el onboarding a través del adapter corregido sin otro cambio de comportamiento que el nombre de las claves enviadas.
REQ-31-05 El test de contrato frontend-backend SHALL verificar que cada clave enviada por invoke desde src/adapters coincide con el parámetro correspondiente del #[tauri::command] invocado según la convención camelCase por defecto de Tauri.
REQ-31-06 IF una invocación de src/adapters envía una clave distinta de la que espera el command, THEN el test de contrato SHALL fallar en pnpm test antes de ejecutar la app.
