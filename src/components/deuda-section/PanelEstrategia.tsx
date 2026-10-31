// Estrategia de ataque (control segmentado) y pago extra mensual.
import { DEBT_STRATEGIES, DEBT_STRATEGY_LABELS } from '../../domain/entities/catalogs.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { useEstrategiaDeuda } from './use-estrategia-deuda.ts';

const EXPLICACION = {
  Avalanche: 'Primero la deuda con la tasa más alta: pagas menos intereses.',
  Snowball: 'Primero la deuda más pequeña: victorias rápidas que motivan.',
} as const;

interface Props {
  readonly control: ReturnType<typeof useEstrategiaDeuda>;
}

export function PanelEstrategia({ control }: Props) {
  const simbolo = simboloDe(usarMoneda());
  return (
    <section className="card" aria-label="Estrategia y pago extra">
      <h2 className="card__titulo">Estrategia</h2>
      <div className="segmentado" role="radiogroup" aria-label="Estrategia de pago">
        {DEBT_STRATEGIES.map((opcion) => (
          <button key={opcion} type="button" role="radio" className="segmentado__opcion"
            aria-checked={control.estrategia === opcion} disabled={control.guardando}
            onClick={() => control.cambiarEstrategia(opcion)}>
            {DEBT_STRATEGY_LABELS[opcion]}
          </button>
        ))}
      </div>
      <p className="card__descripcion">{EXPLICACION[control.estrategia]}</p>
      <label className="campo">
        <span className="campo__etiqueta">Pago extra mensual ({simbolo})</span>
        <input type="number" min="0" step="0.01" value={control.textoExtra}
          onChange={(e) => control.editarExtra(e.target.value)}
          onBlur={control.confirmarExtra}
          onKeyDown={(e) => { if (e.key === 'Enter') control.confirmarExtra(); }} />
        <span className="campo__ayuda">Se suma al pago mínimo y va a la deuda objetivo. Se aplica al salir del campo.</span>
      </label>
    </section>
  );
}
