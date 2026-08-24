# Requisitos — fix-paso2-details-glitch-layout (feature 34)

REQ-34-01 WHEN el usuario alterna una sección Activos Pasivos o Inversiones del Paso 2, el componente SHALL reflejar el estado abierto o cerrado elegido sin reversiones ni bucles de toggle ante re-render.
REQ-34-02 WHILE el wizard re-renderiza por cambios de estado, las secciones details del Paso 2 SHALL conservar el estado abierto o cerrado elegido por el usuario.
REQ-34-03 El contenedor del wizard SHALL mostrar su contenido sin desborde horizontal en ventanas de escritorio de 720 px de ancho o superiores.
REQ-34-04 Los estilos nuevos o modificados de esta feature SHALL usar exclusivamente custom properties de src/styles/tokens.css.
