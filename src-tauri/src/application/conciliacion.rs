//! REQ-13-01..07: caso de uso de conciliación de cuentas (fachada).
//! Re-exporta tipos, histórico y motor desde módulos hermanos.

pub use super::conciliacion_types::{
    ConciliacionError, CuentaConciliada, ConciliacionMensual, HistoricoConciliacion,
};
pub use super::conciliacion_engine::{conciliacion_mensual, agregar_movimiento};