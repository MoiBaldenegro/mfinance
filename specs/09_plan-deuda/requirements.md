# Requisitos — plan-deuda

REQ-09-01 application/ del backend SHALL ordenar las deudas activas por tasa descendente para avalancha y por saldo ascendente para bola de nieve devolviendo ambos órdenes.
REQ-09-02 application/ del backend SHALL proyectar mes a mes pagos mínimos más el extra mensual simulando intereses hasta liquidar todas las deudas registradas.
REQ-09-03 La proyección SHALL devolver meses hasta quedar libre de deuda total pagado e intereses totales comparando con y sin pago extra.
REQ-09-04 La sección Deuda SHALL indicar la deuda a atacar primero según la estrategia elegida destacándola visualmente sobre las demás.
REQ-09-05 WHEN se cambia la estrategia o el pago extra mensual, la proyección las métricas y la gráfica SHALL recalcularse mostrando el nuevo plan.
REQ-09-06 La estrategia elegida SHALL persistirse en Settings del snapshot conservándose entre sesiones.
REQ-09-07 IF no existen deudas registradas THEN la sección SHALL mostrar estado libre de deuda con mensaje en español en lugar de proyección vacía.
