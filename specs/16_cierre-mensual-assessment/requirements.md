# Requisitos — cierre-mensual-assessment

REQ-16-01 La sección Cierre SHALL guiar un wizard de pasos con resumen de evolución de flujo de caja activos pasivos y patrimonio del mes que se cierra.
REQ-16-02 El wizard SHALL permitir presupuestar el mes siguiente fijando objetivos por categoría de gasto a partir del promedio de los últimos tres meses registrados.
REQ-16-03 WHEN el usuario completa el último paso, la app SHALL marcar el mes como cerrado generando el registro del assessment con fecha indicadores y decisiones tomadas.
REQ-16-04 application/ del backend SHALL evaluar reglas sobre los indicadores y datos del mes para producir recomendaciones accionables en español.
REQ-16-05 La sección Consejos SHALL mostrar en todo momento las recomendaciones vigentes recalculadas cuando cambian los datos cargados.
REQ-16-06 IF una regla detecta riesgo como endeudamiento rojo o fondo de emergencia rojo, THEN la recomendación correspondiente SHALL encabezar la lista marcada como prioritaria.
REQ-16-07 WHILE un mes permanece cerrado, su MonthlyRecord SHALL tratarse como solo lectura hasta que el usuario lo reabra explícitamente.
REQ-16-08 El assessment generado SHALL quedar persistido en el snapshot permitiendo consultar los cierres de meses anteriores.
