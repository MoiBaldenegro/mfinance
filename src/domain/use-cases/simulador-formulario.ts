// Parsers del formulario del simulador (REQ-15): de texto crudo a
// crédito y extras del cable serde. Puro: sin React ni IPC; delega la
// validación en simulador-validaciones.
import type {
  CreditoSimulado,
  ExtraordinarioPuntual,
  ExtrasOptimizacion,
} from '../entities/simulador-credito.ts';
import { extrasDesdeFormulario } from './simulador-validaciones.ts';

/** Campos de texto crudos del formulario del simulador. */
export interface CamposTextoCredito {
  readonly importe: string;
  readonly plazoMeses: string;
  readonly tasaInteresAnual: string;
}

function numero(valor: string): number {
  const limpio = valor.trim().replace(',', '.');
  if (limpio === '') return NaN;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : NaN;
}

/** Parsea el crédito del formulario; null si falta o invalida un campo. */
export function creditoDesdeCampos(
  campos: CamposTextoCredito,
): CreditoSimulado | null {
  const importe = numero(campos.importe);
  const plazoMeses = numero(campos.plazoMeses);
  const tasaInteresAnual = numero(campos.tasaInteresAnual);
  if (![importe, plazoMeses, tasaInteresAnual].every(Number.isFinite)) return null;
  if (!Number.isInteger(plazoMeses)) return null;
  return {
    nombre: 'Crédito hipotético',
    importe,
    plazo_meses: plazoMeses,
    tasa_interes_anual: tasaInteresAnual,
  };
}

/** Parsea los extras del formulario; null si algún extra es inválido. */
export function extrasDesdeCampos(
  camposExtraMensual: string,
  extraordinarioMes: string,
  extraordinarioImporte: string,
  plazoMeses: number,
): ExtrasOptimizacion | null {
  const textoMes = extraordinarioMes.trim();
  const textoImporte = extraordinarioImporte.trim();
  const extraMensual =
    camposExtraMensual.trim() === '' ? 0 : numero(camposExtraMensual);
  const extraordinarios: ExtraordinarioPuntual[] =
    textoMes !== '' || textoImporte !== ''
      ? [{ mes: numero(textoMes), importe: numero(textoImporte) }]
      : [];
  const resultado = extrasDesdeFormulario(extraMensual, extraordinarios, plazoMeses);
  if (!resultado.ok || !resultado.extras) return null;
  return resultado.extras;
}
