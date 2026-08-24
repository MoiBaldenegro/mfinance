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
import '../../../styles/simulador-credito.css';

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

  return (
    <section className="simulador-panel" aria-label="Simulador de créditos">
      <header className="simulador-panel__cabecera">
        <h3>Simulador de créditos</h3>
        <span className="simulador-badge">Sandbox · no afecta tu balance</span>
      </header>
      <p className="simulador-panel__ayuda">
        Laboratorio de crédito hipotético: calcula cuota intereses y amortización,
        compara el escenario base con un pago optimizado y pruébalo antes de comprometerte.
      </p>
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
          <div className="simulador-rejilla">
            <TarjetaEscenario titulo="Base" metricas={comparativaDesdeSimulacion(estado.comparada, moneda).base} destacada={false} />
            <TarjetaEscenario titulo="Optimizado" metricas={comparativaDesdeSimulacion(estado.comparada, moneda).optimizado} destacada />
          </div>
          <TablaAmortizacion titulo="Base" filas={filasTablaAmortizacion(estado.comparada.base, moneda)} />
          <TablaAmortizacion titulo="Optimizado" filas={filasTablaAmortizacion(estado.comparada.optimizado, moneda)} />
          <button type="button" className="simulador-boton" onClick={añadirAlPlan}>
            Añadir este crédito a la comparativa
          </button>
        </>
      )}
      {estado.nombre === 'error' && (
        <p className="simulador-error" role="alert">{estado.motivo}</p>
      )}
      <PlanSandbox
        creditos={plan.creditos}
        estrategia={plan.estrategia}
        escenarios={plan.estado.nombre === 'listo' ? plan.estado.plan.escenarios : null}
        onEstrategia={plan.cambiarEstrategia}
        onQuitar={plan.quitarCredito}
        onComparar={compararEstrategias}
      />
      {plan.estado.nombre === 'error' && (
        <p className="simulador-error" role="alert">{plan.estado.motivo}</p>
      )}
    </section>
  );
}
