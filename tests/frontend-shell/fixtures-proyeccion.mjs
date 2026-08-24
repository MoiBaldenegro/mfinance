// Fixtures compartidos de las suites F14 (proyección PyG y balance
// futuro). NO es descubierto por node --test (sin sufijo .test.mjs).

export const SERIE_HISTORICA = {
  filas_historicas: [
    { mes: '2026-04', ingresos: 1800, gastos: 800, utilidad: 1000, ahorro_acumulado: 1000 },
    { mes: '2026-05', ingresos: 2000, gastos: 900, utilidad: 1100, ahorro_acumulado: 2100 },
    { mes: '2026-06', ingresos: 2200, gastos: 1000, utilidad: 1200, ahorro_acumulado: 3300 },
  ],
  filas_proyectadas: [
    { mes: '2026-07', ingresos: 2244, gastos: 1010, utilidad: 1234, ahorro_acumulado: 4534 },
    { mes: '2026-08', ingresos: 2288.88, gastos: 1020.1, utilidad: 1268.78, ahorro_acumulado: 5802.78 },
    { mes: '2026-09', ingresos: 2334.66, gastos: 1030.3, utilidad: 1304.36, ahorro_acumulado: 7107.14 },
    { mes: '2026-10', ingresos: 2381.35, gastos: 1040.6, utilidad: 1340.75, ahorro_acumulado: 8447.89 },
    { mes: '2026-11', ingresos: 2428.98, gastos: 1051.01, utilidad: 1377.97, ahorro_acumulado: 9825.86 },
    { mes: '2026-12', ingresos: 2477.56, gastos: 1061.52, utilidad: 1416.04, ahorro_acumulado: 11241.9 },
    { mes: '2027-01', ingresos: 2527.11, gastos: 1072.14, utilidad: 1454.97, ahorro_acumulado: 12696.87 },
    { mes: '2027-02', ingresos: 2577.65, gastos: 1082.86, utilidad: 1494.79, ahorro_acumulado: 14191.66 },
    { mes: '2027-03', ingresos: 2629.2, gastos: 1093.69, utilidad: 1535.51, ahorro_acumulado: 15727.17 },
    { mes: '2027-04', ingresos: 2681.79, gastos: 1104.62, utilidad: 1577.17, ahorro_acumulado: 17304.34 },
    { mes: '2027-05', ingresos: 2735.42, gastos: 1115.67, utilidad: 1619.75, ahorro_acumulado: 18924.09 },
    { mes: '2027-06', ingresos: 2790.13, gastos: 1126.83, utilidad: 1663.3, ahorro_acumulado: 20587.39 },
  ],
};

export const COLORES = {
  ingresos: '#1f5c45',
  gastos: '#c0392b',
  utilidad: '#2e7d32',
  patrimonio: '#b58a00',
  historico: '#1f5c45',
  proyectado: '#1f5c4580', // 50 % alpha para distinguir
};

export const BALANCE_FUTURO = {
  filas_historicas: [
    { mes: '2026-04', activos: 8000, pasivos: 5000, patrimonio: 3000 },
    { mes: '2026-05', activos: 9000, pasivos: 4800, patrimonio: 4200 },
    { mes: '2026-06', activos: 10000, pasivos: 4600, patrimonio: 5400 },
  ],
  filas_proyectadas: [
    { mes: '2026-07', activos: 11234, pasivos: 4410, patrimonio: 6824 },
    { mes: '2026-08', activos: 12503, pasivos: 4215, patrimonio: 8288 },
    { mes: '2026-09', activos: 13808, pasivos: 4015, patrimonio: 9793 },
    { mes: '2026-10', activos: 15149, pasivos: 3810, patrimonio: 11339 },
    { mes: '2026-11', activos: 16527, pasivos: 3600, patrimonio: 12927 },
    { mes: '2026-12', activos: 17943, pasivos: 3385, patrimonio: 14558 },
    { mes: '2027-01', activos: 19399, pasivos: 3165, patrimonio: 16234 },
    { mes: '2027-02', activos: 20895, pasivos: 2940, patrimonio: 17955 },
    { mes: '2027-03', activos: 22432, pasivos: 2710, patrimonio: 19722 },
    { mes: '2027-04', activos: 24011, pasivos: 2475, patrimonio: 21536 },
    { mes: '2027-05', activos: 25633, pasivos: 2235, patrimonio: 23398 },
    { mes: '2027-06', activos: 27298, pasivos: 1990, patrimonio: 25308 },
  ],
};

export const COLORES_BALANCE = {
  activos: '#1f5c45',
  pasivos: '#c0392b',
  patrimonio: '#b58a00',
  historico: '#1f5c45',
  proyectado: '#1f5c4580',
};
