//! Tabla de reglas del assessment (REQ-16-04): textos accionables en
//! español por indicador y nivel del semáforo [rojo amarillo verde].

/// Regla = (título, textos por severidad, nombres de indicador).
pub struct Regla {
    /// Título corto de la recomendación.
    pub titulo: &'static str,
    /// Texto accionable según severidad: [rojo, amarillo, verde].
    pub textos: [&'static str; 3],
    /// Nombres de indicador que activan esta regla.
    pub indicadores: [&'static str; 1],
}

/// Catálogo exacto de reglas evaluadas por el motor.
pub const REGLAS: [Regla; 4] = [
    Regla {
        titulo: "Deuda fuera de control",
        textos: [
            "Tus cuotas de deuda superan el 30% de tus ingresos: negocia tasas o plazos y congela la deuda nueva este mes.",
            "Cuotas de deuda al límite: dirige el pago extra del plan de deuda a la tasa más alta para bajar del 30%.",
            "Deuda bajo control: mantén las cuotas por debajo del 15% de tus ingresos y evita financiar consumo.",
        ],
        indicadores: ["Endeudamiento"],
    },
    Regla {
        titulo: "Ahorro crítico",
        textos: [
            "Apenas estás ahorrando: recorta primero ocio y otros, y fija un objetivo mínimo del 5% de ingresos.",
            "Tu ahorro es mejorable: automatiza una transferencia al día de cobro para superar el 15% de ingresos.",
            "Buen ritmo de ahorro: mantén la transferencia automática y asegúrate de invertir el excedente.",
        ],
        indicadores: ["Tasa de ahorro"],
    },
    Regla {
        titulo: "Fondo de emergencia crítico",
        textos: [
            "Cubre menos de un mes de gastos: programa un aporte fijo a activos líquidos desde este mismo mes.",
            "Vas camino de los 3 meses de gastos: añade un aporte extra cada mes que cierres en positivo.",
            "Fondo sólido: revisa su importe en cada cierre y mantenlo líquido y separado del dinero diario.",
        ],
        indicadores: ["Fondo de emergencia"],
    },
    Regla {
        titulo: "Ingreso pasivo insuficiente",
        textos: [
            "Tus inversiones no cubren tus gastos básicos: aumenta el aporte mensual según tu perfil de riesgo.",
            "Rendimientos por debajo del 25% de tus gastos: sube el aporte un 10% este trimestre.",
            "Rentas creciendo: reinvierte los rendimientos para acelerar el interés compuesto.",
        ],
        indicadores: ["Ingreso pasivo"],
    },
];
