//! REQ-15: laboratorio sandbox de créditos hipotéticos. Calcula cuota,
//! intereses y tabla de amortización (sistema francés), compara escenario
//! base contra optimizado con extras y aplica avalancha/bola de nieve sobre
//! varios créditos reutilizando las primitivas del motor de plan de deuda.
//! Puro: sin fs ni framework de escritorio; los commands finos lo exponen por IPC y jamás
//! toca pasivos reales (el cálculo no lee el snapshot).

pub mod comparador;
pub mod cuota;
pub mod errores;
pub mod estrategia;
pub mod motor;
pub mod resultado;
pub mod types;
pub mod validacion;

pub use crate::application::simulador_creditos::errores::ErrorSimulacion;
pub use crate::application::simulador_creditos::resultado::{
    EscenarioEstrategia, PlanCreditosSimulados, ResultadoCredito, SimulacionComparada,
};
pub use crate::application::simulador_creditos::types::{
    CreditoSimulado, ExtraordinarioPuntual, ExtrasOptimizacion, FilaAmortizacion,
    PeticionPlanCreditos, PeticionSimulacion,
};
