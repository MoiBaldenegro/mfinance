# Requisitos — tema-oscuro-tokens (feature 17)

## Patrones EARS

REQ-17-01 La aplicación SHALL aplicar el tema oscuro como apariencia por defecto al arrancar sin preferencia almacenada.
REQ-17-02 WHEN el usuario acciona el conmutador de tema en la sección Ajustes, la aplicación SHALL alternar entre tema oscuro y claro aplicándolo al instante en toda la interfaz visible.
REQ-17-03 WHEN el usuario cierra y reabre la aplicación, la aplicación SHALL restaurar el último tema elegido desde la preferencia almacenada.
REQ-17-04 IF no existe preferencia almacenada o su valor es inválido, THEN el caso de uso de resolución de tema SHALL devolver el tema oscuro.
REQ-17-05 WHILE un tema está activo, tokens.css SHALL definir la paleta completa del tema activo mediante custom properties con los nombres de token existentes, WHERE el bloque por defecto es oscuro y el claro vive bajo [data-theme='claro'].
REQ-17-06 WHEN cambia el tema activo, las gráficas Chart.js visibles SHALL redibujarse con los colores resueltos del tema activo sin recargar la aplicación.
REQ-17-07 El acceso a la preferencia de tema SHALL realizarse exclusivamente vía puerto en src/domain/ports e adapter en src/adapters, WHERE ningún componente bajo src/components accede directamente al almacenamiento del navegador.
REQ-17-08 El atributo data-theme SHALL establecerse sobre el elemento raíz del documento antes del primer render, WHERE el valor procede de la preferencia almacenada o del tema oscuro por defecto.
