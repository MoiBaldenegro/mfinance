// Paso 2 del wizard (REQ-16-02): presupuesto del mes siguiente con los
// importes pre-rellenos desde el promedio móvil, editables por categoría
// y total recalculado en vivo.
import { EXPENSE_CATEGORY_LABELS } from '../../domain/entities/catalogs.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/pasos-wizard.css';

interface Props {
  readonly mesSiguiente: string;
  readonly textos: Readonly<Record<string, string>>;
  readonly errores: Readonly<Record<string, string>>;
  readonly total: number;
  readonly alCambiar: (clave: string, texto: string) => void;
}

/** Formulario de objetivos de gasto para el mes siguiente. */
export function PasoPresupuesto({
  mesSiguiente,
  textos,
  errores,
  total,
  alCambiar,
}: Props) {
  const moneda = usarMoneda();
  return (
    <fieldset className="paso-presupuesto">
      <legend className="paso-presupuesto__titulo">
        Presupuesto de {mesSiguiente}
      </legend>
      <p className="paso-presupuesto__ayuda">
        Pre-rellenado con el promedio móvil de tus últimos tres meses:
        mantén cada cifra o ajústala antes de confirmar.
      </p>
      {Object.keys(EXPENSE_CATEGORY_LABELS).map((clave) => (
        <label className="paso-presupuesto__campo" key={clave}>
          <span>{EXPENSE_CATEGORY_LABELS[clave as keyof typeof EXPENSE_CATEGORY_LABELS]}</span>
          <input
            type="text"
            inputMode="decimal"
            value={textos[clave] ?? ''}
            onChange={(evento) => alCambiar(clave, evento.target.value)}
          />
          {errores[`gasto:${clave}`] ? (
            <small className="paso-presupuesto__error" role="alert">
              {errores[`gasto:${clave}`]}
            </small>
          ) : null}
        </label>
      ))}
      <p className="paso-presupuesto__total">
        Total presupuestado: <strong>{formatoMoneda(total, moneda)}</strong>
      </p>
    </fieldset>
  );
}
