# Requisitos — conciliacion-cuentas

REQ-13-01 La sección Conciliación SHALL listar cuentas con nombre saldo inicial movimientos registrados y saldo final esperado.
REQ-13-02 application/ del backend SHALL calcular el saldo teórico de cada cuenta como saldo inicial más la suma algebraica de sus movimientos.
REQ-13-03 La sección Conciliación SHALL marcar cada cuenta como conciliada cuando el saldo real introducido coincide con el saldo teórico y descuadrada en caso contrario.
REQ-13-04 IF una cuenta queda descuadrada, THEN la app SHALL mostrar la diferencia exacta en euros junto a un campo para registrar el ajuste que cuadra el saldo.
REQ-13-05 WHEN el usuario registra un movimiento con fecha importe y concepto, la app SHALL recalcular el saldo teórico de la cuenta al confirmar.
REQ-13-06 WHEN todas las cuentas quedan conciliadas, la app SHALL mostrar confirmación en español y persistir el estado actualizado del snapshot.
REQ-13-07 Los estados de cuenta SHALL conservar su histórico mensual permitiendo consultar la conciliación de meses anteriores sin mezclar saldos entre meses.
