//! REQ-11-02/05: caso de uso que calcula la proyección de valor futuro
//! de las inversiones por familia a 5, 10 y 20 años con interés compuesto
//! (capitalización mensual) sobre el valor actual más aportes mensuales
//! capitalizados a la tasa esperada. Valida tasa en [0, 30].

use serde::Serialize;

use crate::domain::errors::TasaFueraDeRangoError;
use crate::domain::investment::InvestmentFamily;
use crate::domain::repository::SnapshotRepository;
use crate::domain::repository_errors::SnapshotLoadError;
use crate::domain::snapshot::FinanceSnapshot;

/// Error de la proyección: carga o validación de tasa.
#[derive(Debug)]
pub enum ProyeccionError {
    Carga(SnapshotLoadError),
    Tasa(TasaFueraDeRangoError),
}

impl From<SnapshotLoadError> for ProyeccionError {
    fn from(e: SnapshotLoadError) -> Self {
        ProyeccionError::Carga(e)
    }
}

impl From<TasaFueraDeRangoError> for ProyeccionError {
    fn from(e: TasaFueraDeRangoError) -> Self {
        ProyeccionError::Tasa(e)
    }
}

impl std::fmt::Display for ProyeccionError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ProyeccionError::Carga(e) => write!(f, "{e}"),
            ProyeccionError::Tasa(e) => write!(f, "{e}"),
        }
    }
}

/// Proyección de una familia de inversión.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProyeccionFamilia {
    /// Familia canónica: renta_fija | renta_variable | finca_raiz.
    pub familia: String,
    /// Valor futuro proyectado a 5 años.
    pub valor_futuro_5: f64,
    /// Valor futuro proyectado a 10 años.
    pub valor_futuro_10: f64,
    /// Valor futuro proyectado a 20 años.
    pub valor_futuro_20: f64,
}

/// Proyección completa de todas las inversiones.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct ProyeccionInversiones {
    /// Proyección por familia (orden catálogo: renta_fija, renta_variable, finca_raiz).
    pub familias: Vec<ProyeccionFamilia>,
    /// Suma de aportes mensuales de todas las familias (total invertido del mes).
    pub total_aportes_mensuales: f64,
}

/// Calcula el valor futuro con capitalización mensual.
/// VF = PV * (1 + r_m)^n + PMT * ((1 + r_m)^n - 1) / r_m
/// donde r_m = tasa_anual / 100 / 12, n = años * 12.
/// Si tasa = 0: VF = PV + PMT * n.
fn valor_futuro_mensual(valor_actual: f64, aporte_mensual: f64, tasa_anual_pct: f64, anos: u32) -> f64 {
    let meses = anos * 12;
    if tasa_anual_pct == 0.0 {
        return valor_actual + aporte_mensual * meses as f64;
    }
    let r_m = tasa_anual_pct / 100.0 / 12.0;
    let factor = (1.0 + r_m).powi(meses as i32);
    valor_actual * factor + aporte_mensual * (factor - 1.0) / r_m
}

/// Motor puro: proyección sobre un snapshot cualquiera.
pub fn calcular_proyeccion(snapshot: &FinanceSnapshot) -> Result<ProyeccionInversiones, TasaFueraDeRangoError> {
    let mut familias = Vec::new();
    let mut total_aportes = 0.0;

    for family in InvestmentFamily::ALL {
        // Buscar la inversión de esta familia
        let Some(inv) = snapshot.investments.iter().find(|i| i.familia() == family) else {
            continue; // Sin inversión en esta familia → no aparece en proyección
        };

        let tasa = inv.tasa_esperada_anual();
        // Validación REQ-11-05: tasa en [0, 30]
        if tasa < 0.0 || tasa > 30.0 {
            return Err(TasaFueraDeRangoError::new(family.as_str(), tasa));
        }

        let aporte = inv.aporte_mensual();
        let valor = inv.valor_actual();
        total_aportes += aporte;

        familias.push(ProyeccionFamilia {
            familia: family.as_str().to_string(),
            valor_futuro_5: valor_futuro_mensual(valor, aporte, tasa, 5),
            valor_futuro_10: valor_futuro_mensual(valor, aporte, tasa, 10),
            valor_futuro_20: valor_futuro_mensual(valor, aporte, tasa, 20),
        });
    }

    Ok(ProyeccionInversiones {
        familias,
        total_aportes_mensuales: total_aportes,
    })
}

/// Calcula la proyección del estado vigente delegando la carga en el puerto.
pub fn inversiones_proyeccion(
    repository: &dyn SnapshotRepository,
) -> Result<ProyeccionInversiones, ProyeccionError> {
    let snapshot = repository.load()?;
    Ok(calcular_proyeccion(&snapshot)?)
}