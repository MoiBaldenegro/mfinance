// REQ-26-01: Sección Deuda — estrategia (tarjetas de opción con radio
// nativo) y pago extra mensual.
import { simboloDe } from '../../domain/entities/moneda.ts';
import type { Paso3Data } from '../../domain/entities/onboarding/index.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import '../../styles/onboarding-deuda.css';

const ESTRATEGIAS = [
  { valor: 'Avalanche', titulo: 'Avalancha', texto: 'Paga primero la deuda con mayor tasa. Ahorras más en intereses.' },
  { valor: 'Snowball', titulo: 'Bola de nieve', texto: 'Paga primero la deuda más pequeña. Liquidas deudas antes y ganas impulso.' },
] as const;

interface Props {
  readonly paso3: Paso3Data;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly moneda: Moneda;
  readonly deshabilitado: boolean;
}

export function DeudaSection({ paso3, alCambiar, moneda, deshabilitado }: Props) {
  return (
    <section className="ob-deuda" aria-labelledby="ob-deuda-titulo">
      <h3 id="ob-deuda-titulo" className="ob-deuda__subtitulo">Estrategia de deuda</h3>
      <div className="ob-deuda__opciones" role="radiogroup" aria-labelledby="ob-deuda-titulo">
        {ESTRATEGIAS.map((e) => (
          <label key={e.valor} className="ob-deuda__opcion">
            <input type="radio" name="estrategia" value={e.valor} checked={paso3.estrategia_deuda === e.valor}
              onChange={() => alCambiar({ ...paso3, estrategia_deuda: e.valor })} disabled={deshabilitado} />
            <span className="ob-deuda__opcion-texto">
              <strong>{e.titulo}</strong>
              <span>{e.texto}</span>
            </span>
          </label>
        ))}
      </div>
      <label className="campo ob-deuda__extra" htmlFor="pago-extra">
        <span className="campo__etiqueta">Pago extra mensual ({simboloDe(moneda)})</span>
        <input id="pago-extra" type="number" inputMode="decimal" min="0" step="1"
          value={paso3.pago_extra_mensual || ''} placeholder="0"
          onChange={(e) => alCambiar({ ...paso3, pago_extra_mensual: Math.max(0, Number(e.target.value) || 0) })}
          disabled={deshabilitado} />
        <span className="campo__ayuda">Lo que puedes destinar cada mes, además de los pagos mínimos.</span>
      </label>
    </section>
  );
}
