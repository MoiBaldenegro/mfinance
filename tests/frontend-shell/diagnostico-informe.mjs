// Fixture compartido de la feature 12: informe de lote con un archivo
// analizado (3 movimientos) y uno corrupto, tal como llega del backend.
/** @type {import('../../src/domain/entities/diagnostico.ts').ResultadoLote} */
export const INFORME = {
  mes: '2026-06',
  archivos: [
    {
      archivo: 'extracto.pdf',
      estado: 'Analizado',
      mensaje: '3 movimiento(s) detectados en "extracto.pdf"',
      coherencia: 'Verificada',
      movimientos: [
        { fecha: '2026-06-01', comercio: 'SUPERMERCADO ACME', importe: -45.3 },
        { fecha: '2026-06-03', comercio: 'NOMINA EMPRESA', importe: 2350 },
        { fecha: '2026-06-05', comercio: 'GASOLINA REPSOL', importe: -23.75 },
      ],
    },
    {
      archivo: 'roto.pdf',
      estado: 'Corrupto',
      mensaje: 'el archivo "roto.pdf" está corrupto',
      movimientos: [],
      coherencia: null,
    },
  ],
};
