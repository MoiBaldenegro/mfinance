// Barril de la lógica pura de la proyección PyG 12 meses (feature 14):
// tabla, supuestos y gráfica bajo un único punto de importación. Los
// módulos especializados siguen siendo la fuente de verdad; aquí solo se
// re-exportan sus símbolos públicos para consumidores de la vista.
export {
  filasDeTablaProyeccion,
  serieProyeccionVacia,
  MENSAJE_SIN_HISTORICO,
  type FilaTablaProyeccion,
} from './pyg-proyeccion-tabla.ts';
export {
  supuestosPorDefecto,
  aplicarSupuestos,
} from './pyg-proyeccion-supuestos.ts';
export {
  datosDeGraficaProyeccion,
  type ColoresProyeccion,
  type DatosGraficaProyeccion,
} from './pyg-proyeccion-grafica.ts';
