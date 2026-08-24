# Requisitos — indicadores-semaforo

REQ-10-01 application/ del backend SHALL calcular los cuatro indicadores clave sobre el mes de referencia usando registro mensual balance e inversiones vigentes.
REQ-10-02 El indicador endeudamiento SHALL clasificar verde con carga de cuotas menor al 15 por ciento de los ingresos amarillo desde 15 hasta 30 y rojo por encima de 30.
REQ-10-03 El indicador tasa de ahorro SHALL clasificar verde por encima del 15 por ciento amarillo desde 5 hasta 15 y rojo por debajo de 5.
REQ-10-04 El indicador fondo de emergencia SHALL clasificar verde con tres o más meses de gastos cubiertos amarillo desde uno inclusive hasta menos de tres y rojo con menos de uno.
REQ-10-05 El indicador ingreso pasivo SHALL clasificar verde cuando cubre el 100 por ciento del gasto amarillo desde 25 hasta menos de 100 y rojo por debajo de 25.
REQ-10-06 La sección Indicadores SHALL renderizar cuatro tarjetas con nombre valor calculado y punto de color según semáforo.
REQ-10-07 IF falta dato necesario para un indicador como ingresos cero, THEN la tarjeta correspondiente SHALL mostrar estado sin datos en gris con explicación breve en español.
REQ-10-08 WHEN cambian registros balances o inversiones, los indicadores SHALL recalcularse al recargar mostrando siempre valores consistentes con los datos guardados.
