# Requisitos — inversiones-proyeccion

REQ-11-01 La sección Inversiones SHALL listar aportes mensuales valor actual y tasa esperada por familia renta_fija renta_variable y finca_raiz permitiendo editarlos.
REQ-11-02 application/ del backend SHALL calcular el valor futuro de cada familia a 5 10 y 20 años con interés compuesto sobre el valor actual más los aportes mensuales capitalizados a la tasa esperada.
REQ-11-03 WHEN se edita la tasa esperada de una familia, la proyección SHALL recalcularse al confirmar mostrando las tres cifras nuevas.
REQ-11-04 La sección Inversiones SHALL mostrar una gráfica Chart.js comparando el valor futuro total proyectado a 5 10 y 20 años por familia.
REQ-11-05 IF la tasa esperada introducida es negativa o superior a un límite razonable del 30 por ciento anual, THEN el formulario SHALL rechazarla con mensaje en español.
REQ-11-06 La suma de aportes mensuales de todas las familias SHALL coincidir con el total invertido del mes mostrado junto a la tabla.
REQ-11-07 Los valores proyectados SHALL formatearse en euros sin decimales para lectura rápida.
