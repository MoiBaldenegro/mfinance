// Resumen informativo del lote por archivo (REQ-12-16/17): alimenta el
// panel DiagnosticoInforme; nunca bloquea la revisión fila a fila.
import type {
  ResultadoArchivoPdf,
  ResultadoLote,
} from '../entities/diagnostico.ts';

export interface ResumenLotePdf {
  readonly total: number;
  readonly analizados: number;
  readonly ilegibles: number;
  readonly corruptos: number;
  readonly fallidos: number;
  readonly conCoherencia: number;
}

/** Conteo de estados y coherencias del informe del análisis. */
export function resumenLote(informe: ResultadoLote): ResumenLotePdf {
  const por = (estado: string) =>
    informe.archivos.filter((a: ResultadoArchivoPdf) => a.estado === estado)
      .length;
  const conCoherencia = informe.archivos.filter(
    (a) => a.coherencia !== null,
  ).length;
  return {
    total: informe.archivos.length,
    analizados: por('Analizado'),
    ilegibles: por('Ilegible'),
    corruptos: por('Corrupto'),
    fallidos: por('Fallido'),
    conCoherencia,
  };
}
