# Requisitos — 32 fix-balance-crud-commands

## Requisitos

REQ-32-01 El backend Tauri SHALL exponer commands de alta-edición y borrado de activos y pasivos que operen sobre el snapshot del perfil activo.
REQ-32-02 WHEN el frontend invoca el upsert de un activo o de un pasivo, el command SHALL persistir el cambio en el snapshot del perfil activo y devolver el snapshot actualizado.
REQ-32-03 WHEN el frontend invoca el borrado de un activo o de un pasivo por su nombre, el command SHALL eliminarlo del snapshot del perfil activo y devolver el snapshot actualizado.
REQ-32-04 IF el valor de un activo o el saldo o la tasa de un pasivo incumplen las validaciones de dominio, THEN el command SHALL rechazar la operación con error nombrado en español sin persistir cambios.
REQ-32-05 El adapter frontend de snapshot SHALL invocar los commands de balance registrados con claves de cable acordes a la convención camelCase por defecto de Tauri.
REQ-32-06 La sección Balance SHALL crear editar y eliminar activos y pasivos con los cambios persistidos en el perfil activo y visibles tras recargar la app.
