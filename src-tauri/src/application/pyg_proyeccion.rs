//! REQ-14-01/02: proyección a 12 meses de PyG con supuestos editables y
//! balance futuro amortizando pasivos según los pagos actuales registrados
//! (cuotas_deuda del último mes). Puro: sin fs ni framework de escritorio; el command fino
//! lo expone por IPC. Tipos, motores y fachada viven en submódulos.

mod engine_balance;
mod engine_pyg;
mod fachada;
mod types;

pub use engine_balance::calcular_balance_futuro;
pub use engine_pyg::calcular_proyeccion_pyg;
pub use fachada::{balance_futuro, proyeccion_pyg, ProyeccionError};
pub use types::{
    BalanceFuturo, FilaBalanceFuturo, FilaProyeccionPyg, ProyeccionPyg,
    SupuestosProyeccion,
};
