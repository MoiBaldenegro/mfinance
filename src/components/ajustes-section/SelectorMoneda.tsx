// REQ-20-01: selector tipo grupo segmentado con las tres divisas del
// catálogo etiquetadas en español; marca la activa (aria-pressed) y
// delega el cambio. Sin lógica: la persistencia vive en use-cambio-moneda.
import { ETIQUETA_MONEDA, MONEDAS } from '../../domain/entities/moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/selector-moneda.css';

interface Props {
  readonly alCambiar: (moneda: Moneda) => void;
}

/** Bloque "Moneda" de Ajustes: tres opciones segmentadas MXN USD EUR. */
export function SelectorMoneda({ alCambiar }: Props) {
  const activa = usarMoneda();
  return (
    <div className="ajustes-section__moneda">
      <span className="ajustes-section__tema-etiqueta">Moneda</span>
      <div
        className="selector-moneda"
        role="group"
        aria-label="Moneda de visualización de los importes"
      >
        {MONEDAS.map((moneda) => (
          <button
            key={moneda}
            type="button"
            className={
              moneda === activa
                ? 'selector-moneda__opcion selector-moneda__opcion--activa'
                : 'selector-moneda__opcion'
            }
            aria-pressed={moneda === activa}
            onClick={() => alCambiar(moneda)}
          >
            {ETIQUETA_MONEDA[moneda]}
          </button>
        ))}
      </div>
    </div>
  );
}
