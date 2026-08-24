# Requisitos — pyg-proyeccion-supuestos

REQ-14-01 application/ del backend SHALL proyectar 12 meses de PyG aplicando supuestos editables de variación porcentual mensual sobre ingresos y sobre cada categoría de gasto.
REQ-14-02 El backend SHALL proyectar también el balance futuro calculando patrimonio mes a mes con los mismos supuestos y amortización de pasivos según pagos actuales.
REQ-14-03 WHEN el usuario edita un supuesto y confirma, las tablas y gráficas de proyección SHALL refrescar con la serie recalculada partiendo del histórico real guardado.
REQ-14-04 La vista SHALL distinguir visualmente meses históricos reales de meses proyectados tanto en tabla como en gráfica.
REQ-14-05 IF no hay al menos un mes histórico registrado, THEN la proyección SHALL mostrarse vacía con mensaje en español pidiendo registrar el primer mes.
REQ-14-06 La sección SHALL incluir botón restablecer supuestos que devuelva todos los parámetros a cero variación mostrando la continuación plana del último mes real.
REQ-14-07 Las gráficas de proyección SHALL usar Chart.js manteniendo los colores de series de la feature P&G para lectura comparativa.
