//! Casos de uso del diagnóstico PDF (feature 12): tipos y errores
//! (`tipos`), subida y análisis de lotes con catch_unwind por archivo
//! (`analisis` + `informe`), confirmación al MonthlyRecord
//! (`confirmacion`) y parser puro del texto extraído.

pub mod analisis;
pub mod confirmacion;
pub mod informe;
pub mod parser_coherencia;
pub mod parser_extracto;
pub mod parser_fecha;
pub mod parser_importe;
pub mod parser_lineas;
pub mod tipos;

pub use analisis::{analizar_lote, subir_comprobantes};
pub use confirmacion::confirmar_movimientos;
pub use tipos::{DiagnosticoError, MovimientoAceptado};
