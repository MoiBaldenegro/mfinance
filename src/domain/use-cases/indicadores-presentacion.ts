// Presentación de los indicadores del semáforo: qué miden, la meta (los
// umbrales viven en src-tauri/src/application/indicadores_constants.rs),
// el valor formateado y un estado legible.
import type { IndicadorResultado, Indicadores, SemaphoreType } from '../entities/indicadores.ts';
import type { Moneda } from '../entities/moneda.ts';
import { formatoPorcentaje } from './formato-porcentaje.ts';

export const ORDEN_INDICADORES: readonly (keyof Indicadores)[] = [
  'tasa_ahorro', 'fondo_emergencia', 'endeudamiento', 'ingreso_pasivo',
];

const GUIA: Readonly<Record<keyof Indicadores, { readonly mide: string; readonly meta: string }>> = {
  endeudamiento: { mide: 'Parte de tus ingresos que va a cuotas de deuda.', meta: 'Meta: 15 % o menos · alerta desde 30 %' },
  tasa_ahorro: { mide: 'Parte de tus ingresos que no gastas.', meta: 'Meta: 15 % o más · alerta por debajo de 5 %' },
  fondo_emergencia: { mide: 'Meses de gastos cubiertos con tus activos líquidos.', meta: 'Meta: 3 meses o más · alerta por debajo de 1' },
  ingreso_pasivo: { mide: 'Cuánto de tus gastos cubren tus inversiones.', meta: 'Meta: 100 % · alerta por debajo de 25 %' },
};

const ESTADO: Readonly<Record<SemaphoreType, string>> = {
  verde: 'Saludable', amarillo: 'Atención', rojo: 'Crítico',
};

export function guiaIndicador(clave: keyof Indicadores) {
  return GUIA[clave];
}

export function estadoIndicador(clasificacion: SemaphoreType): string {
  return ESTADO[clasificacion];
}

/** «2.4 meses» para el fondo; porcentaje con la convención de la moneda para el resto. */
export function valorIndicador(clave: keyof Indicadores, indicador: IndicadorResultado, moneda: Moneda): string {
  if (clave === 'fondo_emergencia') {
    return `${formatoPorcentaje(indicador.valor, moneda).replace(' %', '')} meses`;
  }
  return formatoPorcentaje(indicador.valor, moneda);
}
