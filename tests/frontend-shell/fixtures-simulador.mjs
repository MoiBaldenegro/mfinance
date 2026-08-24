// Fixtures compartidos de las suites del simulador de créditos (F15):
// respuesta del backend para la comparativa base vs optimizado y un
// resultado de amortización de dos meses. Sin sufijo .test.mjs para que
// el descubrimiento bare de node --test no lo ejecute como suite.
export const SIMULACION = {
  base: {
    cuota_mensual: 888.49,
    meses: 12,
    intereses_totales: 661.85,
    total_pagado: 10_661.85,
    tabla: [],
  },
  optimizado: {
    cuota_mensual: 1_088.49,
    meses: 10,
    intereses_totales: 543.11,
    total_pagado: 10_543.11,
    tabla: [],
  },
  meses_ahorrados: 2,
  intereses_ahorrados: 118.74,
};

export const RESULTADO_AMORTIZACION = {
  cuota_mensual: 888.49,
  meses: 2,
  intereses_totales: 111.51,
  total_pagado: 1_776.98,
  tabla: [
    {
      mes: 1,
      cuota: 888.49,
      interes: 100.0,
      capital: 788.49,
      saldo_restante: 9_211.51,
      total_acumulado: 888.49,
    },
    {
      mes: 2,
      cuota: 888.49,
      interes: 92.12,
      capital: 796.37,
      saldo_restante: 8_415.14,
      total_acumulado: 1_776.98,
    },
  ],
};
