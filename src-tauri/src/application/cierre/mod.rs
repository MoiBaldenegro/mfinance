//! Cierre mensual guiado (REQ-16): promedio móvil del presupuesto,
//! reglas del assessment, fecha ISO sin crates, tipos nombrados, lecturas
//! (fachada) y escrituras (cerrar/reabrir). Re-exporta la API pública.

pub mod cierre_ops;
pub mod errores;
pub mod fachada;
pub mod fecha;
pub mod peticion;
pub mod promedio_movil;
pub mod reglas;
pub mod reglas_textos;
pub mod tipos;

pub use cierre_ops::{cerrar_mes, reabrir_mes};
pub use errores::ErrorCierre;
pub use fachada::{consejos_vigentes, resumen_cierre};
pub use peticion::PeticionCierre;
pub use tipos::{
    MesFlujo, PatrimonioActual, Recomendacion, ResumenCierre, Severidad,
};
