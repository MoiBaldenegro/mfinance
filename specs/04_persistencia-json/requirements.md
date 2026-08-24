# Requisitos — persistencia-json

REQ-04-01 infrastructure/json_repository SHALL implementar el trait SnapshotRepository persistiendo el FinanceSnapshot como un archivo JSON único dentro de Documents/mfinance/.
REQ-04-02 WHEN la app arranca sin datos guardados en Documents/mfinance/, el sistema SHALL generar y guardar un seed de datos de ejemplo realistas coherente entre registros balances deudas inversiones e indicadores.
REQ-04-03 WHEN se guarda el snapshot, el adaptador JSON SHALL serializar con serde y escribir el archivo de forma atómica dejando siempre JSON válido en disco.
REQ-04-04 El command export_json SHALL copiar el JSON vigente a una ruta elegida por el usuario devolviendo la ruta escrita.
REQ-04-05 WHEN se importa un archivo JSON válido vía import_json, el sistema SHALL reemplazar el snapshot vigente por el contenido importado y persistirlo en Documents/mfinance/.
REQ-04-06 IF el archivo importado no es JSON válido o no cumple el esquema del snapshot, THEN import_json SHALL devolver el error nombrado correspondiente sin alterar los datos vigentes.
REQ-04-07 El composition root lib.rs SHALL construir el adapter JSON inyectarlo en application/ y registrar los commands load_state save_state export_json e import_json.
REQ-04-08 Los handlers #[tauri::command] SHALL delegar en application/ sin contener lógica de negocio ni acceso directo al sistema de archivos.
REQ-04-09 Los tests del adaptador SHALL verificar round-trip de serialización sobre un FinanceSnapshot de ejemplo sin perder campos usando directorios temporales y sin tocar Documents real.
