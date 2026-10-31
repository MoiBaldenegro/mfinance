// Panel del simulador de créditos (REQ-15): vista sandbox embebida en la
// sección Deuda. Compara base vs optimizado con badge visible y nunca
// altera pasivos reales: guardar es una decisión explícita fuera de aquí.
import { comparativaDesdeSimulacion, filasTablaAmortizacion } from '../../../domain/use-cases/simulador-comparativa.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';
import { usePlanSandbox } from './use-plan-sandbox.ts';
import { useSimulador } from './use-simulador.ts';
import { FormularioCredito } from './FormularioCredito.tsx';
import { TarjetaEscenario } from './TarjetaEscenario.tsx';
import { ResumenAhorro } from './ResumenAhorro.tsx';
import { TablaAmortizacion } from './TablaAmortizacion.tsx';
import { PlanSandbox } from './PlanSandbox.tsx';
import { Pestanas } from '../../ui/Pestanas.tsx';
import '../../../styles/simulador.css';

export function SimuladorPanel() {
  const moneda = usarMoneda();
  const simulador = useSimulador();
  const plan = usePlanSandbox();
  const { estado } = simulador;

  const añadirAlPlan = () => {
    if (simulador.creditoActual !== null) plan.añadirCredito(simulador.creditoActual);
  };
  const compararEstrategias = () => {
    const extra = Number(simulador.campos.extraMensual.replace(',', '.'));
    void plan.calcularPlan(Number.isFinite(extra) ? extra : 0);
  };

  const credito = (
    <div className="simulador__modo">
      <FormularioCredito
        campos={simulador.campos}
        onCampo={simulador.actualizarCampo}
        onCalcular={() => void simulador.calcular()}
        mensajeError={simulador.mensajeError}
      />
      {estado.nombre === 'listo' && (
        <>
          <ResumenAhorro
            mesesAhorrados={estado.comparada.meses_ahorrados}
            interesesAhorrados={comparativaDesdeSimulacion(estado.comparada, moneda).interesesAhorrados}
            hayAhorro={comparativaDesdeSimulacion(estado.comparada, moneda).hayAhorro}
          />
          <div className="rejilla rejilla--2">
            <TarjetaEscenario titulo="Base" metricas={comparativaDesdeSimulacion(estado.comparada, moneda).base} destacada={false} />
            <TarjetaEscenario titulo="Optimizado" metricas={comparativaDesdeSimulacion(estado.comparada, moneda).optimizado} destacada />
          </div>
          <div className="rejilla rejilla--2 simulador__tablas">
            <TablaAmortizacion titulo="Base" filas={filasTablaAmortizacion(estado.comparada.base, moneda)} />
            <TablaAmortizacion titulo="Optimizado" filas={filasTablaAmortizacion(estado.comparada.optimizado, moneda)} />
          </div>
          <button type="button" className="btn simulador__accion" onClick={añadirAlPlan}>
            Añadir este crédito a la comparativa
          </button>
        </>
      )}
      {estado.nombre === 'error' && (
        <p className="aviso aviso--error" role="alert">{estado.motivo}</p>
      )}
    </div>
  );
  const comparar = (
    <div className="simulador__modo">
      <PlanSandbox
        creditos={plan.creditos}
        estrategia={plan.estrategia}
        escenarios={plan.estado.nombre === 'listo' ? plan.estado.plan.escenarios : null}
        onEstrategia={plan.cambiarEstrategia}
        onQuitar={plan.quitarCredito}
        onComparar={compararEstrategias}
      />
      {plan.estado.nombre === 'error' && (
        <p className="aviso aviso--error" role="alert">{plan.estado.motivo}</p>
      )}
    </div>
  );
  return (
    <section className="simulador" aria-label="Simulador de créditos">
      <p className="simulador__intro">
        <span className="badge badge--info">No afecta tu balance</span>
        <span className="texto-muted">Prueba créditos hipotéticos antes de comprometerte.</span>
      </p>
      <Pestanas id="simulador" etiqueta="Modos del simulador" pestanas={[
        { id: 'credito', titulo: 'Un crédito', contenido: credito },
        { id: 'comparar', titulo: 'Comparar créditos', insignia: plan.creditos.length ? String(plan.creditos.length) : undefined, contenido: comparar },
      ]} />
    </section>
  );
}
