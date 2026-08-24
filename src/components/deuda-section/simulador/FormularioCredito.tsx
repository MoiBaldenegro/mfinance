// Formulario compacto del simulador: importe plazo tasa y extras
// (REQ-15-05). Renderiza y delega: la validación vive en use-cases.
// REQ-20-05: las etiquetas muestran el símbolo de la moneda activa.
import { simboloDe } from '../../../domain/entities/moneda.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';
import type { CamposSimulador } from './use-simulador.ts';
import '../../../styles/simulador-formulario.css';

interface Props {
  readonly campos: CamposSimulador;
  readonly onCampo: (campo: keyof CamposSimulador, valor: string) => void;
  readonly onCalcular: () => void;
  readonly mensajeError: string | null;
}

function Campo(
  etiqueta: string,
  id: string,
  valor: string,
  alCambiar: (valor: string) => void,
  min: string,
  step = '0.01',
) {
  return (
    <div className="simulador-campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        type="number"
        min={min}
        step={step}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
      />
    </div>
  );
}

export function FormularioCredito({ campos, onCampo, onCalcular, mensajeError }: Props) {
  const simbolo = simboloDe(usarMoneda());
  return (
    <section className="simulador-formulario" aria-label="Crédito hipotético">
      {Campo(`Importe (${simbolo})`, 'sim-importe', campos.importe, (v) => onCampo('importe', v), '1')}
      {Campo('Plazo (meses)', 'sim-plazo', campos.plazoMeses, (v) => onCampo('plazoMeses', v), '1', '1')}
      {Campo('Tasa anual (%)', 'sim-tasa', campos.tasaInteresAnual, (v) => onCampo('tasaInteresAnual', v), '0')}
      {Campo(`Extra mensual (${simbolo})`, 'sim-extra', campos.extraMensual, (v) => onCampo('extraMensual', v), '0')}
      {Campo('Extraordinario: mes', 'sim-ext-mes', campos.extraordinarioMes, (v) => onCampo('extraordinarioMes', v), '1', '1')}
      {Campo(`Extraordinario: importe (${simbolo})`, 'sim-ext-importe', campos.extraordinarioImporte, (v) => onCampo('extraordinarioImporte', v), '0')}
      <button type="button" className="simulador-boton" onClick={onCalcular}>
        Calcular simulación
      </button>
      {mensajeError !== null && (
        <p className="simulador-error" role="alert">
          {mensajeError}
        </p>
      )}
    </section>
  );
}
