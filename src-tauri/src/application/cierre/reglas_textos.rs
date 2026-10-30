//! Tabla de reglas del assessment (REQ-16-04): textos accionables en
//! español por indicador y nivel del semáforo [rojo amarillo verde].

/// Regla = (títulos y textos por severidad, nombres de indicador).
pub struct Regla {
    /// Título corto según severidad: [rojo, amarillo, verde].
    pub titulos: [&'static str; 3],
    /// Texto accionable según severidad: [rojo, amarillo, verde].
    pub textos: [&'static str; 3],
    /// Nombres de indicador que activan esta regla.
    pub indicadores: [&'static str; 1],
}

/// Catálogo exacto de reglas evaluadas por el motor.
pub const REGLAS: [Regla; 4] = [
    Regla {
        titulos: ["Deuda fuera de control", "Deuda al límite", "Deuda bajo control"],
        textos: [
            "Tus cuotas de deuda superan el 30% de tus ingresos: negocia tasas o plazos y congela la deuda nueva este mes.",
            "Tus cuotas de deuda están entre el 15% y el 30% de tus ingresos: dirige el pago extra del plan a la tasa más alta para bajar del 15%.",
            "Deuda bajo control: mantén las cuotas por debajo del 15% de tus ingresos y evita financiar consumo.",
        ],
        indicadores: ["Endeudamiento"],
    },
    Regla {
        titulos: ["Ahorro crítico", "Ahorro mejorable", "Buen ritmo de ahorro"],
        textos: [
            "Apenas estás ahorrando: recorta primero ocio y otros, y fija un objetivo mínimo del 5% de ingresos.",
            "Tu ahorro es mejorable: automatiza una transferencia al día de cobro para superar el 15% de ingresos.",
            "Buen ritmo de ahorro: mantén la transferencia automática y asegúrate de invertir el excedente.",
        ],
        indicadores: ["Tasa de ahorro"],
    },
    Regla {
        titulos: ["Fondo de emergencia crítico", "Fondo de emergencia en construcción", "Fondo de emergencia sólido"],
        textos: [
            "Cubre menos de un mes de gastos: programa un aporte fijo a activos líquidos desde este mismo mes.",
            "Vas camino de los 3 meses de gastos: añade un aporte extra cada mes que cierres en positivo.",
            "Fondo sólido: revisa su importe en cada cierre y mantenlo líquido y separado del dinero diario.",
        ],
        indicadores: ["Fondo de emergencia"],
    },
    Regla {
        titulos: ["Ingreso pasivo insuficiente", "Ingreso pasivo en crecimiento", "Ingreso pasivo sólido"],
        textos: [
            "Tus inversiones no cubren tus gastos básicos: aumenta el aporte mensual según tu perfil de riesgo.",
            "Tus rendimientos ya cubren parte de tus gastos, pero no todos: sube el aporte un 10% este trimestre.",
            "Rentas creciendo: reinvierte los rendimientos para acelerar el interés compuesto.",
        ],
        indicadores: ["Ingreso pasivo"],
    },
];
