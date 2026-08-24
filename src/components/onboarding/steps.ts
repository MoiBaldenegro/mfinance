export const PASOS = [
  { id: 1, titulo: 'Datos personales', key: 'paso1' },
  { id: 2, titulo: 'Balance inicial', key: 'paso2' },
  { id: 3, titulo: 'Deuda y proyección', key: 'paso3' },
  { id: 4, titulo: 'Umbrales y metas', key: 'paso4' },
  { id: 5, titulo: 'Resumen y finalizar', key: 'paso5' },
] as const;

export type PasoInfo = typeof PASOS[0];