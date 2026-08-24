# Requisitos — domain-core-backend

REQ-03-01 src-tauri/src/domain SHALL definir la entidad MonthlyRecord con clave YYYY-MM ingresos por fuente salario freelance arriendos y otros y gastos por categoría vivienda alimentacion transporte cuotas_deuda ocio y otros.
REQ-03-02 src-tauri/src/domain SHALL definir las entidades Asset con nombre y valor actual y Liability con nombre saldo y tasa de interés anual.
REQ-03-03 src-tauri/src/domain SHALL definir la entidad Investment con familia renta_fija renta_variable o finca_raiz aporte mensual valor actual y tasa esperada editable.
REQ-03-04 src-tauri/src/domain SHALL definir la entidad AccountStatement con saldo inicial movimientos y saldo final para conciliación.
REQ-03-05 src-tauri/src/domain SHALL definir el agregado FinanceSnapshot que agrupa registros mensuales activos pasivos inversiones estados de cuenta y ajustes de estrategia.
REQ-03-06 src-tauri/src/domain SHALL declarar el trait-puerto SnapshotRepository con operaciones load save export e import sobre FinanceSnapshot.
REQ-03-07 src-tauri/src/domain SHALL definir un tipo de error nombrado propio para cada operación fallible del dominio sin usar errores genéricos de librerías externas.
REQ-03-08 IF un MonthlyRecord recibe una fuente de ingreso o categoría de gasto fuera del catálogo definido, THEN el dominio SHALL rechazarlo con el error nombrado correspondiente.
REQ-03-09 IF un Asset un Liability o un Investment recibe un valor negativo, THEN el dominio SHALL rechazarlo con el error nombrado correspondiente.
REQ-03-10 Los tests cargo test del dominio SHALL ejecutarse en verde sin dependencia del crate tauri ni de red ni de sistema de archivos.
REQ-03-11 Ningún archivo bajo src-tauri/src/domain SHALL superar las 100 líneas.
