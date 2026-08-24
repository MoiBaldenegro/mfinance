// Barril de la lógica pura del balance futuro proyectado (feature 14):
// tabla y gráfica bajo un único punto de importación. Los módulos
// especializados siguen siendo la fuente de verdad; aquí solo se
// re-exportan sus símbolos públicos para consumidores de la vista.
export {
  filasDeTablaBalanceFuturo,
  balanceFuturoVacio,
  MENSAJE_SIN_BALANCE_HISTORICO,
  type FilaTablaBalanceFuturo,
} from './balance-futuro-tabla.ts';
export {
  datosDeGraficaBalanceFuturo,
  type ColoresBalanceFuturo,
  type DatosGraficaBalanceFuturo,
} from './balance-futuro-grafica.ts';
