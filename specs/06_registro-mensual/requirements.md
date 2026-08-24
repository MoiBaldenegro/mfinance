# Requisitos — registro-mensual

REQ-06-01 La sección Registro SHALL presentar un selector de mes YYYY-MM con botones mes anterior y mes siguiente.
REQ-06-02 El formulario del mes SHALL editar ingresos netos por fuente salario freelance arriendos y otros con importes en euros.
REQ-06-03 El formulario del mes SHALL editar gastos por categoría vivienda alimentacion transporte cuotas_deuda ocio y otros con importes en euros.
REQ-06-04 WHEN el usuario confirma los cambios del formulario, la app SHALL persistir el MonthlyRecord del mes vía puerto IPC y reflejar los datos tras recargar.
REQ-06-05 El formulario SHALL mostrar totales de ingresos y de gastos del mes recalculados al editar cualquier importe.
REQ-06-06 IF el usuario introduce un importe negativo o no numérico, THEN el formulario SHALL bloquear el guardado mostrando el error en español junto al campo afectado.
REQ-06-07 WHILE hay un guardado en curso, el botón confirmar SHALL permanecer deshabilitado mostrando su estado ocupado.
REQ-06-08 WHEN se selecciona un mes sin registro previo, el formulario SHALL abrirse a ceros listo para capturar sin arrastrar datos de otros meses.
