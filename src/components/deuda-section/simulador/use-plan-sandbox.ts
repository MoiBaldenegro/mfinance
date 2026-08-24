// Hook del plan sandbox multi-crédito (REQ-15-03): acumula créditos
// HIPOTÉTICOS en una lista local (jamás pasivos reales) y pide al puerto
// el plan avalancha/bola de nieve reutilizando el motor de plan-deuda.
import { useCallback, useState } from 'react';
import type { CreditoSimulado, EstrategiaSandbox } from '../../../domain/entities/simulador-credito.ts';
import type { PlanCreditosSimulados } from '../../../domain/entities/simulador-plan.ts';
import { simuladorPort } from '../../../adapters/simulador-ipc-adapter.ts';

export type EstadoPlanSandbox =
  | { readonly nombre: 'inactivo' }
  | { readonly nombre: 'error'; readonly motivo: string }
  | { readonly nombre: 'listo'; readonly plan: PlanCreditosSimulados };

const MOTIVO_POR_OMISION = 'No se pudo calcular el plan de créditos simulados.';

/** Lista local de créditos hipotéticos y su comparación por estrategia. */
export function usePlanSandbox() {
  const [creditos, setCreditos] = useState<readonly CreditoSimulado[]>([]);
  const [estrategia, setEstrategia] = useState<EstrategiaSandbox>('Avalanche');
  const [estado, setEstado] = useState<EstadoPlanSandbox>({ nombre: 'inactivo' });

  const añadirCredito = useCallback((credito: CreditoSimulado) => {
    setCreditos((previos) => [...previos, credito]);
    setEstado({ nombre: 'inactivo' });
  }, []);

  const quitarCredito = useCallback((indice: number) => {
    setCreditos((previos) => previos.filter((_, i) => i !== indice));
    setEstado({ nombre: 'inactivo' });
  }, []);

  const cambiarEstrategia = useCallback((nueva: EstrategiaSandbox) => {
    setEstrategia(nueva);
  }, []);

  const calcularPlan = useCallback(
    async (extraMensual: number) => {
      if (creditos.length === 0) return;
      try {
        const plan = await simuladorPort.simularPlanCreditos({
          creditos,
          extra_mensual: Math.max(0, extraMensual),
        });
        setEstado({ nombre: 'listo', plan });
      } catch (error: unknown) {
        const motivo = error instanceof Error && error.message
          ? error.message
          : MOTIVO_POR_OMISION;
        setEstado({ nombre: 'error', motivo });
      }
    },
    [creditos],
  );

  return {
    creditos,
    estrategia,
    estado,
    añadirCredito,
    quitarCredito,
    cambiarEstrategia,
    calcularPlan,
  };
}
