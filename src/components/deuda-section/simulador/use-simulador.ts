// Hook del simulador de créditos (REQ-15): mantiene el formulario en
// estado local, valida con use-cases puros y pide la comparación al
// puerto. Glue de UI: nunca toca pasivos reales ni persiste nada.
import { useCallback, useState } from 'react';
import type { CreditoSimulado, SimulacionComparada } from '../../../domain/entities/simulador-credito.ts';
import { simuladorPort } from '../../../adapters/simulador-ipc-adapter.ts';
import {
  validarPeticionSimulacion,
} from '../../../domain/use-cases/simulador-validaciones.ts';
import {
  creditoDesdeCampos,
  extrasDesdeCampos,
} from '../../../domain/use-cases/simulador-formulario.ts';

/** Campos de texto del formulario del crédito hipotético. */
export interface CamposSimulador {
  readonly importe: string;
  readonly plazoMeses: string;
  readonly tasaInteresAnual: string;
  readonly extraMensual: string;
  readonly extraordinarioMes: string;
  readonly extraordinarioImporte: string;
}

export type EstadoSimulacion =
  | { readonly nombre: 'inactivo' }
  | { readonly nombre: 'error'; readonly motivo: string }
  | { readonly nombre: 'listo'; readonly comparada: SimulacionComparada };

const CAMPOS_INICIALES: CamposSimulador = {
  importe: '',
  plazoMeses: '',
  tasaInteresAnual: '',
  extraMensual: '',
  extraordinarioMes: '',
  extraordinarioImporte: '',
};

export function useSimulador() {
  const [campos, setCampos] = useState<CamposSimulador>(CAMPOS_INICIALES);
  const [estado, setEstado] = useState<EstadoSimulacion>({ nombre: 'inactivo' });
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  const actualizarCampo = useCallback((campo: keyof CamposSimulador, valor: string) => {
    setCampos((previos) => ({ ...previos, [campo]: valor }));
    setMensajeError(null);
    setEstado({ nombre: 'inactivo' });
  }, []);

  /** Crédito parseado de los campos; null si aún no es calculable. */
  const creditoActual: CreditoSimulado | null = creditoDesdeCampos(campos);

  const calcular = useCallback(async () => {
    if (creditoActual === null) {
      setMensajeError('Completa importe plazo y tasa para simular.');
      setEstado({ nombre: 'inactivo' });
      return;
    }
    const validacion = validarPeticionSimulacion({
      importe: creditoActual.importe,
      plazoMeses: creditoActual.plazo_meses,
      tasaInteresAnual: creditoActual.tasa_interes_anual,
    });
    if (!validacion.ok) {
      setMensajeError(validacion.mensaje);
      setEstado({ nombre: 'inactivo' });
      return;
    }
    const extras = extrasDesdeCampos(
      campos.extraMensual,
      campos.extraordinarioMes,
      campos.extraordinarioImporte,
      creditoActual.plazo_meses,
    );
    if (extras === null) {
      setMensajeError('Revisa el pago extra mensual y el pago extraordinario.');
      return;
    }
    try {
      const comparada = await simuladorPort.simularCredito({
        credito: creditoActual,
        extras,
      });
      setEstado({ nombre: 'listo', comparada });
    } catch (error: unknown) {
      const motivo = error instanceof Error && error.message ? error.message : 'No se pudo simular.';
      setEstado({ nombre: 'error', motivo });
    }
  }, [campos, creditoActual]);

  return { campos, actualizarCampo, estado, mensajeError, calcular, creditoActual };
}
