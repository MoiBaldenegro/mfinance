# Requisitos — refino-visual-secciones (feature 18)

## Patrones EARS

REQ-18-01 Cada sección SHALL presentar jerarquía visual consistente construida exclusivamente con tokens de tipografía espaciado radio sombra y color.
REQ-18-02 WHEN el puntero o el foco recorre un control interactivo, el control SHALL mostrar estados hover focus-visible y activo definidos con tokens.
REQ-18-03 WHILE un tema está activo, las superficies de tarjetas tablas formularios y paneles SHALL usar la elevación borde y fondo del tema activo sin valores sueltos.
REQ-18-04 IF una vista muestra estado vacío o de carga, THEN la vista SHALL aplicar el patrón visual común de estados vacíos definido con tokens.
REQ-18-05 Los estilos del refino SHALL vivir en hojas de src/styles separadas de los componentes, WHERE ningún archivo creado o modificado supera las 100 líneas.
REQ-18-06 El refino SHALL preservar el comportamiento funcional de las diez secciones, WHERE la suite pnpm test pasa íntegra sin modificar tests funcionales.
