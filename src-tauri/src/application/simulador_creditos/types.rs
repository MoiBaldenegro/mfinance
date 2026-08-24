//! Tipos de entrada y salida del simulador de créditos, serializables
//! para cruzar el IPC sin transformaciones (espejo en
//! src/domain/entities/simulador-credito.ts).

use serde::{Deserialize, Serialize};

/// Crédito hipotético configurado por el usuario.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct CreditoSimulado {
    /// Nombre descriptivo del crédito simulado.
    pub nombre: String,
    /// Importe solicitado en euros.
    pub importe: f64,
    /// Plazo del crédito en meses.
    pub plazo_meses: u32,
    /// Tasa de interés anual en %.
    pub tasa_interes_anual: f64,
}

/// Pago extraordinario puntual aplicado al final de un mes concreto.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct ExtraordinarioPuntual {
    /// Mes (1-indexed) al que se aplica el pago extraordinario.
    pub mes: u32,
    /// Importe del pago extraordinario en euros.
    pub importe: f64,
}

/// Optimización sobre el escenario base: extra mensual recurrente más
/// extraordinarios puntuales.
#[derive(Debug, Clone, PartialEq, Default, Serialize, Deserialize)]
pub struct ExtrasOptimizacion {
    /// Cantidad adicional que se paga cada mes junto a la cuota.
    pub extra_mensual: f64,
    /// Pagos extraordinarios puntuales por mes e importe.
    pub extraordinarios: Vec<ExtraordinarioPuntual>,
}

/// Petición completa del simulador para un crédito: hipótesis + extras.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PeticionSimulacion {
    /// Crédito hipotético configurado.
    pub credito: CreditoSimulado,
    /// Extras del escenario optimizado.
    pub extras: ExtrasOptimizacion,
}

/// Petición de plan estratégico sobre varios créditos simulados.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct PeticionPlanCreditos {
    /// Créditos simulados sobre los que aplicar las estrategias.
    pub creditos: Vec<CreditoSimulado>,
    /// Pago extra mensual dedicado al crédito objetivo.
    pub extra_mensual: f64,
}

/// Fila mes a mes de la tabla de amortización (REQ-15-06).
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct FilaAmortizacion {
    /// Número de mes (1-indexed).
    pub mes: u32,
    /// Cuota realmente pagada en el mes.
    pub cuota: f64,
    /// Parte de la cuota destinada a intereses.
    pub interes: f64,
    /// Parte de la cuota destinada a capital.
    pub capital: f64,
    /// Saldo restante tras el pago del mes.
    pub saldo_restante: f64,
    /// Total pagado acumulado hasta el mes.
    pub total_acumulado: f64,
}
