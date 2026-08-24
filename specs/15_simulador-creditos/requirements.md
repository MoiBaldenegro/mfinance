# Requisitos — simulador-creditos

REQ-15-01 application/ del backend SHALL calcular la cuota mensual el total de intereses y la tabla de amortización de un crédito a partir de importe plazo y tasa de interés.
REQ-15-02 El simulador SHALL comparar escenarios de pago aplicando pagos extra mensuales o pagos extraordinarios puntuales sobre el crédito configurado.
REQ-15-03 WHEN el usuario aplica la estrategia activa avalancha o bola de nieve sobre varios créditos simulados, el backend SHALL reutilizar el motor de plan de deuda devolviendo orden de ataque e intereses totales por escenario.
REQ-15-04 La sección SHALL mostrar lado a lado el escenario base y el escenario optimizado con meses ahorrados e intereses ahorrados en euros.
REQ-15-05 IF el importe el plazo o la tasa introducidos son inválidos como plazo cero o tasa negativa, THEN el formulario SHALL rechazar el cálculo con mensaje en español.
REQ-15-06 La tabla de amortización SHALL permitir consultarse mes a mes mostrando capital interés saldo y total acumulado.
REQ-15-07 El simulador SHALL operar sobre hipótesis sin alterar los pasivos reales del balance hasta que el usuario decida guardarlos.
