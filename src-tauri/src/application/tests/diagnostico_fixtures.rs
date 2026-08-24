//! Fixtures compartidos del diagnóstico (patrón cierre_fixtures /
//! pyg_proyeccion_fixtures): líneas del extracto sintético del journey
//! REQ-12-21 y constructores de movimientos aceptados para confirmar.

use crate::application::diagnostico::MovimientoAceptado;
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::comprobante_pdf::{MovimientoDetectado, ResultadoArchivoPdf};
use crate::domain::monthly_record::MonthlyRecord;
use crate::domain::snapshot::FinanceSnapshot;

/// Líneas del extracto sintético del journey: importes trampa
/// (trailing minus, paréntesis, millares), concepto multilínea,
/// blacklist del banco y saldos que CUADRAN para la golden rule.
pub const LINEAS_EXTRACTO: &[&str] = &[
    "BANCO EJEMPLO EXTRACTO MENSUAL JUNIO",
    "Saldo inicial 1.000,00",
    "01/06/2026 SUPERMERCADO ACME 45,30-",
    "03/06/2026 NOMINA EMPRESA 2.350,00",
    "05/06/2026 GASOLINA REPSOL (23,75)",
    "ESTACION NUMERO 7 CARRETERA N-III",
    "10/06/2026 ALQUILER PISO 800,00-",
    "Estimado cliente gracias por su confianza",
    "Total movimientos 4",
    "Saldo final 2.480,95",
];

/// Acepta un movimiento detectado asignándole su categoría.
pub fn aceptar(
    movimiento: &MovimientoDetectado,
    categoria: ExpenseCategory,
) -> MovimientoAceptado {
    MovimientoAceptado { movimiento: movimiento.clone(), categoria }
}

/// Construye un movimiento aceptado desde sus campos.
pub fn aceptado(
    fecha: &str,
    comercio: &str,
    importe: f64,
    categoria: ExpenseCategory,
) -> MovimientoAceptado {
    MovimientoAceptado {
        movimiento: MovimientoDetectado::nuevo(fecha, comercio, importe),
        categoria,
    }
}

/// Registro del mes dentro de un snapshot (falla nombrado si falta).
pub fn registro_de<'a>(
    snapshot: &'a FinanceSnapshot,
    mes: &str,
) -> &'a MonthlyRecord {
    snapshot
        .monthly_records
        .iter()
        .find(|r| r.mes().as_str() == mes)
        .expect("registro del mes creado")
}

/// Mensaje de un resultado que cita el archivo concreto.
pub fn mensaje_cita(r: &ResultadoArchivoPdf, archivo: &str) -> bool {
    r.mensaje.contains(archivo)
}
