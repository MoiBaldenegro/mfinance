// Metadatos de los 5 pasos del wizard: única fuente para el indicador de
// progreso y la cabecera de cada paso. Solo el paso 1 es obligatorio.
export const PASOS = [
  { id: 1, titulo: 'Datos personales', key: 'paso1', opcional: false,
    descripcion: 'Cómo te llamas, en qué moneda ves tus números y de dónde entra y sale tu dinero.' },
  { id: 2, titulo: 'Balance inicial', key: 'paso2', opcional: true,
    descripcion: 'Lo que tienes y lo que debes hoy. Es el punto de partida de tu patrimonio.' },
  { id: 3, titulo: 'Deuda y proyección', key: 'paso3', opcional: true,
    descripcion: 'Cómo atacar tus deudas y qué esperas que cambien tus ingresos y gastos.' },
  { id: 4, titulo: 'Umbrales y metas', key: 'paso4', opcional: true,
    descripcion: 'Ajusta los semáforos a tu criterio y anota tus objetivos.' },
  { id: 5, titulo: 'Resumen', key: 'paso5', opcional: false,
    descripcion: 'Revisa lo capturado. Al finalizar se guarda en tu perfil.' },
] as const;

export type PasoInfo = typeof PASOS[number];
