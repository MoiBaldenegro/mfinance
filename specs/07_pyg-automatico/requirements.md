# Requisitos — pyg-automatico

REQ-07-01 application/ del backend SHALL calcular la serie mensual ordenada de ingresos gastos utilidad y ahorro acumulado a partir de los MonthlyRecord cargados.
REQ-07-02 La sección P&G SHALL renderizar una tabla mes a mes con columnas mes ingresos gastos utilidad y ahorro acumulado en formato europeo.
REQ-07-03 La sección P&G SHALL renderizar una gráfica de barras de ingresos contra gastos por mes con línea superpuesta de ahorro acumulado usando Chart.js.
REQ-07-04 docs/dependencies.md SHALL registrar chart.js con versión exacta scope dependencies fecha aprobada y motivo pedido explícito por el humano en el requerimiento.
REQ-07-05 WHEN cambian los datos de cualquier mes, la tabla y la gráfica SHALL refrescar con la serie recalculada tras recargar el snapshot.
REQ-07-06 IF no existe ningún registro mensual, THEN la sección P&G SHALL mostrar un mensaje en español invitando a registrar el primer mes en lugar de una gráfica vacía.
REQ-07-07 La utilidad mensual SHALL calcularse como ingresos menos gastos del mes y el ahorro acumulado como suma corrida de utilidades desde el primer mes registrado.
