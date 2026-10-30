// Selector segmentado de la moneda de visualización (MXN USD EUR). Sin
// lógica: la persistencia vive en use-cambio-moneda.
import { ETIQUETA_MONEDA, MONEDAS } from '../../domain/entities/moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';

interface Props {
  readonly alCambiar: (moneda: Moneda) => void;
}

export function SelectorMoneda({ alCambiar }: Props) {
  const activa = usarMoneda();
  return (
    <div className="segmentado" role="group" aria-label="Moneda de visualización de los importes">
      {MONEDAS.map((moneda) => (
        <button key={moneda} type="button" className="segmentado__opcion"
          aria-pressed={moneda === activa} onClick={() => alCambiar(moneda)}>
          {ETIQUETA_MONEDA[moneda]}
        </button>
      ))}
    </div>
  );
}
