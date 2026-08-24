# Requisitos — balance-general

REQ-08-01 La sección Balance SHALL listar los activos con nombre categoría liquido inversion o propiedad y valor actual permitiendo crearlos editarlos y eliminarlos.
REQ-08-02 La sección Balance SHALL listar los pasivos con nombre saldo pendiente y tasa de interés anual permitiendo crearlos editarlos y eliminarlos.
REQ-08-03 application/ del backend SHALL calcular el patrimonio como suma de activos menos suma de pasivos devolviendo también ambos totales.
REQ-08-04 La sección Balance SHALL mostrar las tarjetas resumen total activos total pasivos y patrimonio con el signo correcto.
REQ-08-05 La sección Balance SHALL renderizar la evolución mensual del patrimonio en gráfica Chart.js a partir del histórico guardado.
REQ-08-06 IF un alta o edición introduce valor o saldo negativo, THEN la app SHALL rechazarla con mensaje en español sin persistir.
REQ-08-07 WHEN se confirma un cambio de activos o pasivos, la app SHALL guardar el snapshot y refrescar totales tarjetas y gráfica de evolución.
