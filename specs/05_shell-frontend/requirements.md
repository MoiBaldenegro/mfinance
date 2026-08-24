# Requisitos — shell-frontend

REQ-05-01 src/domain SHALL contener los tipos TS espejo de las entidades del backend y los puertos propios sin importar react ni @tauri-apps/api.
REQ-05-02 El adapter bajo src/adapters/ SHALL ser el único módulo del frontend que invoque invoke exponiendo operaciones tipadas de load save export e import.
REQ-05-03 WHEN la app arranca, el caso de uso de carga SHALL pedir el snapshot vía puerto IPC poblando el estado compartido de la UI.
REQ-05-04 La App SHALL navegar entre las secciones Registro PyG Balance Deuda Inversiones Indicadores Conciliación Cierre Diagnóstico y Ajustes mostrando placeholders en español con datos del snapshot cargado.
REQ-05-05 src/styles/tokens.css SHALL definir custom properties de color espaciado radio sombra tipografía y estados semánticos verde amarillo rojo usados por toda la UI.
REQ-05-06 Ningún componente .tsx SHALL contener CSS embebido importando su hoja desde src/styles/.
REQ-05-07 IF la carga inicial del snapshot falla, THEN la App SHALL mostrar un error nombrado en español con acción reintentar en lugar de pantalla vacía.
