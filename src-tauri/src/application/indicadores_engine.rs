//! Motor puro de indicadores: calcula los 4 indicadores sobre un snapshot cualquiera.
//! Puro: sin fs ni framework de escritorio; reutilizable por tests y fachada.
use crate::application::indicadores_constants::*;
use crate::application::indicadores_types::{IndicadorResultado, Indicadores, Semaphore};
use crate::domain::catalogs::ExpenseCategory;
use crate::domain::snapshot::FinanceSnapshot;

pub fn calcular_indicadores(snapshot: &FinanceSnapshot) -> Indicadores {
    let ultimo_registro = snapshot.monthly_records.last();
    
    let (ingresos_mes, gastos_mes, cuotas_deuda_mes) = match ultimo_registro {
        Some(reg) => {
            let ingresos = reg.total_income();
            let gastos = reg.total_expense();
            let cuotas_deuda = reg.gasto(ExpenseCategory::CuotasDeuda).copied().unwrap_or(0.0);
            (ingresos, gastos, cuotas_deuda)
        }
        None => (0.0, 0.0, 0.0),
    };

    // Endeudamiento: cuotas_deuda / ingresos * 100
    let endeudamiento = if ingresos_mes > 0.0 {
        let valor = (cuotas_deuda_mes / ingresos_mes) * 100.0;
        let clasificacion = if valor < ENDEUDAMIENTO_VERDE_MAX {
            Semaphore::Verde
        } else if valor > ENDEUDAMIENTO_ROJO_MIN {
            Semaphore::Rojo
        } else {
            Semaphore::Amarillo
        };
        IndicadorResultado::con_valor("Endeudamiento", valor, clasificacion)
    } else {
        IndicadorResultado::sin_datos("Endeudamiento", "Ingresos del mes son cero")
    };

    // Tasa de ahorro: (ingresos - gastos) / ingresos * 100
    let tasa_ahorro = if ingresos_mes > 0.0 {
        let valor = ((ingresos_mes - gastos_mes) / ingresos_mes) * 100.0;
        let clasificacion = if valor > AHORRO_VERDE_MIN {
            Semaphore::Verde
        } else if valor < AHORRO_ROJO_MAX {
            Semaphore::Rojo
        } else {
            Semaphore::Amarillo
        };
        IndicadorResultado::con_valor("Tasa de ahorro", valor, clasificacion)
    } else {
        IndicadorResultado::sin_datos("Tasa de ahorro", "Ingresos del mes son cero")
    };

    // Fondo de emergencia: activos líquidos / gastos_mensuales (en meses)
    let activos_liquidos: f64 = snapshot
        .assets
        .iter()
        .filter(|a| a.categoria() == crate::domain::asset::AssetCategory::Liquido)
        .map(|a| a.valor_actual())
        .sum();
    
    let fondo_emergencia = if gastos_mes > 0.0 {
        let valor = activos_liquidos / gastos_mes;
        let clasificacion = if valor >= FONDO_VERDE_MIN {
            Semaphore::Verde
        } else if valor < FONDO_ROJO_MAX {
            Semaphore::Rojo
        } else {
            Semaphore::Amarillo
        };
        IndicadorResultado::con_valor("Fondo de emergencia", valor, clasificacion)
    } else {
        IndicadorResultado::sin_datos("Fondo de emergencia", "Gastos del mes son cero")
    };

    // Ingreso pasivo: sum(valor_actual * tasa_esperada_anual / 100 / 12) / gastos_mes * 100
    let ingreso_pasivo_mensual: f64 = snapshot
        .investments
        .iter()
        .map(|inv| inv.valor_actual() * inv.tasa_esperada_anual() / 100.0 / 12.0)
        .sum();
    
    let ingreso_pasivo = if gastos_mes > 0.0 {
        let valor = (ingreso_pasivo_mensual / gastos_mes) * 100.0;
        let clasificacion = if valor >= INGRESO_PASIVO_VERDE_MIN {
            Semaphore::Verde
        } else if valor < INGRESO_PASIVO_ROJO_MAX {
            Semaphore::Rojo
        } else {
            Semaphore::Amarillo
        };
        IndicadorResultado::con_valor("Ingreso pasivo", valor, clasificacion)
    } else {
        IndicadorResultado::sin_datos("Ingreso pasivo", "Gastos del mes son cero")
    };

    Indicadores {
        endeudamiento,
        tasa_ahorro,
        fondo_emergencia,
        ingreso_pasivo,
    }
}