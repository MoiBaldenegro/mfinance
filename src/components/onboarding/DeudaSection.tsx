// REQ-26-01: Sección Deuda — selector estrategia + pago extra (≤100 líneas)
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import type { Paso3Data } from '../../domain/entities/onboarding/index.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import '../../styles/deuda-section.css';

interface Props {
  readonly paso3: Paso3Data;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly moneda: Moneda;
  readonly deshabilitado: boolean;
}

export function DeudaSection({ paso3, alCambiar, moneda, deshabilitado }: Props) {
  const manejarEstrategia = (e: React.ChangeEvent<HTMLInputElement>) => {
    alCambiar({ ...paso3, estrategia_deuda: e.target.value as 'Avalanche' | 'Snowball' });
  };
  const manejarPagoExtra = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = Math.max(0, Number(e.target.value) || 0);
    alCambiar({ ...paso3, pago_extra_mensual: n });
  };

  return (
    <section className="deuda-section">
      <h4 className="deuda-section__subtitulo">Estrategia de deuda</h4>
      <div className="deuda-section__radios">
        <label className="deuda-section__radio">
          <input type="radio" name="estrategia" value="Avalanche" checked={paso3.estrategia_deuda === 'Avalanche'} onChange={manejarEstrategia} disabled={deshabilitado} />
          <span>Avalancha (mayor tasa primero)</span>
        </label>
        <label className="deuda-section__radio">
          <input type="radio" name="estrategia" value="Snowball" checked={paso3.estrategia_deuda === 'Snowball'} onChange={manejarEstrategia} disabled={deshabilitado} />
          <span>Bola de nieve (menor saldo primero)</span>
        </label>
      </div>
      <div className="deuda-section__grupo">
        <label className="deuda-section__label" htmlFor="pago-extra">Pago extra mensual</label>
        <input id="pago-extra" type="number" min="0" step="1" value={paso3.pago_extra_mensual} onChange={manejarPagoExtra} disabled={deshabilitado} className="deuda-section__input" />
        <span className="deuda-section__sufijo">{formatoMoneda(paso3.pago_extra_mensual, moneda)}</span>
      </div>
    </section>
  );
}