//! Motor de simulación pura para el plan de deuda: proyección mes a mes
//! con interés compuesto mensual. Raíz del módulo: re-exporta la API
//! pública histórica y expone las primitivas (`ordenar_por_tasa`,
//! `ordenar_por_saldo`, `proyectar_orden`) que reutiliza el simulador de
//! créditos (REQ-15-03) sin duplicar lógica.

pub mod fachada;
pub mod mes;
pub mod motor;
pub mod orden;
pub mod tipos;

pub use crate::application::plan_deuda_simulacion::fachada::calcular_plan_deuda;
pub use crate::application::plan_deuda_simulacion::motor::proyectar_orden;
pub use crate::application::plan_deuda_simulacion::orden::{
    orden_avalancha, orden_bola_nieve, ordenar_por_saldo, ordenar_por_tasa,
};
pub use crate::application::plan_deuda_simulacion::tipos::{
    DeudaPlan, FilaProyeccionDeuda, PlanDeuda, ProyeccionDeuda,
};
