# Requisitos — diagnostico-pdf

REQ-12-01 IF docs/dependencies.md no registra pdf-extract como crate aprobado por el humano THEN la feature SHALL permanecer blocked sin implementación parcial.
REQ-12-02 La entrada de aprobación de pdf-extract en docs/dependencies.md SHALL documentar costo licencia y cobertura frente a las alternativas evaluadas lopdf y pdfjs-dist.
REQ-12-03 WHEN el humano materializa la aprobación de pdf-extract en docs/dependencies.md THEN la feature SHALL desbloquearse pasando a pending con la versión concreta fijada en src-tauri/Cargo.toml.
REQ-12-04 La sección Diagnóstico SHALL permitir subir uno o varios PDFs asociándolos al mes seleccionado.
REQ-12-05 WHEN se sube un PDF, el backend SHALL guardarlo en Documents/mfinance/comprobantes/<YYYY-MM>/ conservando el nombre original.
REQ-12-06 WHEN el usuario pulsa analizar, el servicio de análisis del backend SHALL procesar los PDFs del mes extrayendo fecha comercio e importe de cada movimiento detectado mediante pdf-extract en Rust.
REQ-12-07 Los handlers #[tauri::command] de la feature SHALL delegar en casos de uso de application quedando registrados en lib.rs sin contener lógica de negocio propia.
REQ-12-08 El frontend SHALL limitarse a presentar la tabla revisable y los estados del análisis sin ejecutar ninguna lógica de parseo de PDF en TypeScript.
REQ-12-09 La sección Diagnóstico SHALL comunicarse con el backend únicamente vía puerto de dominio implementado por el adapter IPC bajo src/adapters/ sin llamadas invoke en componentes.
REQ-12-10 El resultado del análisis SHALL presentarse como tabla revisable donde el usuario confirma edita o descarta cada movimiento fila a fila antes de incorporarlo.
REQ-12-11 La tabla revisable SHALL permitir asignar o editar en cada movimiento una categoría de gasto del catálogo cerrado antes de confirmarlo.
REQ-12-12 WHEN el usuario confirma movimientos, el sistema SHALL incorporarlos al MonthlyRecord del mes correspondiente persistiendo el snapshot actualizado.
REQ-12-13 IF un PDF está corrupto o ilegible THEN el análisis SHALL informar el archivo concreto afectado sin abortar el resto del lote.
REQ-12-14 WHEN un archivo del lote dispara un pánico interno durante la extracción con pdf-extract, el servicio de análisis SHALL aislarlo mediante catch_unwind reportándolo como archivo fallido sin abortar el resto del lote.
REQ-12-15 IF la capa de texto extraída de un PDF queda por debajo del umbral de ilegibilidad de 60 caracteres por página THEN el análisis SHALL clasificarlo como ilegible informándolo en el resultado sin abortar el resto del lote.
REQ-12-16 El análisis SHALL validar la coherencia informativa de cada archivo contrastando saldo inicial más abonos menos cargos contra el saldo impreso clasificando el archivo como verificado discrepancia o no verificable.
REQ-12-17 El indicador de coherencia SHALL mostrarse en la interfaz como información del lote sin impedir la revisión ni la confirmación fila a fila.
REQ-12-18 El parser SHALL interpretar importes en formato español con punto de millares coma decimal y símbolo euro conservando la exactitud de céntimos.
REQ-12-19 El parser SHALL normalizar las fechas detectadas en formato dd/mm/yyyy dd/mm/yy o ISO YYYY-MM-DD al formato YYYY-MM-DD del dominio.
REQ-12-20 WHEN una línea sin fecha inicial ni importe continúa el concepto del movimiento anterior, el parser SHALL concatenarla al movimiento previo sin generar filas fantasma.
REQ-12-21 El journey completo subir analizar verificar datos y actualizar herramienta SHALL quedar cubierto por pruebas automatizadas end-to-end antes de cerrar la feature.
