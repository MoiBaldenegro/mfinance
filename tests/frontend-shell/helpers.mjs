// Helpers compartidos de la suite frontend-shell (feature 5): fixture de
// snapshot coherente con los tipos espejo y puerto falso configurable.
// Este archivo NO es descubierto por node --test (no casa con *.test.mjs);
// solo lo importan los archivos de test del directorio.

/** Rótulos exactos del REQ-05-04 en su orden canónico. */
export const TITULOS_REQ_05_04 = [
  'Registro',
  'PyG',
  'Balance',
  'Deuda',
  'Inversiones',
  'Indicadores',
  'Conciliación',
  'Cierre',
  'Diagnóstico',
  'Ajustes',
];

/** Snapshot mínimo coherente con los tipos espejo del backend. */
export function snapshotDePrueba() {
  return {
    monthly_records: [
      {
        mes: '2026-07',
        ingresos: { Salario: 2000 },
        gastos: { Vivienda: 800, Ocio: 100 },
      },
      {
        mes: '2026-08',
        ingresos: { Salario: 2500, Freelance: 300, Arriendos: 650 },
        gastos: {
          Vivienda: 980,
          Alimentacion: 380,
          CuotasDeuda: 364,
          Ocio: 150,
        },
      },
    ],
    assets: [{ nombre: 'Cuenta corriente', valor_actual: 4180.5 }],
    liabilities: [
      {
        nombre: 'Préstamo del coche',
        saldo_pendiente: 8400,
        tasa_interes_anual: 6.5,
      },
      {
        nombre: 'Préstamo personal',
        saldo_pendiente: 2300,
        tasa_interes_anual: 9.8,
      },
    ],
    investments: [
      {
        familia: 'RentaFija',
        aporte_mensual: 150,
        valor_actual: 7800,
        tasa_esperada_anual: 3.5,
      },
      {
        familia: 'RentaVariable',
        aporte_mensual: 250,
        valor_actual: 12400,
        tasa_esperada_anual: 7,
      },
    ],
    account_statements: [
      {
        cuenta: 'Principal',
        saldo_inicial: 1000,
        movimientos: [
          { fecha: '2026-08-01', concepto: 'Nómina', importe: 2500 },
        ],
        saldo_final: 3500,
      },
      { cuenta: 'Secundaria', saldo_inicial: 500, movimientos: [], saldo_final: 999 },
    ],
    strategy: { debt_strategy: 'Avalanche', extra_monthly_payment: 120, currency: 'EUR' },
  };
}

/** Puerto falso configurable para observar el caso de uso sin IPC real. */
export function puertoFalso(load) {
  return {
    load,
    save: async () => undefined,
    export: async (destination) => destination,
    import: async (origin) => ({ ...snapshotDePrueba(), cuenta: origin }),
  };
}
