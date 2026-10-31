// Paso 2 del wizard (REQ-16-02): presupuesto del mes siguiente con los
// importes pre-rellenos desde el promedio móvil, editables por categoría
// y total recalculado en vivo.
import { EXPENSE_CATEGORY_LABELS } from '../../domain/entities/catalogs.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { etiquetaMes } from '../../domain/use-cases/etiqueta-mes.ts';

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
    <fieldset className="paso-cierre">
      <legend className="paso-cierre__titulo">Presupuesto de {etiquetaMes(mesSiguiente)}</legend>
      <p className="card__descripcion">
        Pre-rellenado con el promedio móvil de tus últimos tres meses:
        mantén cada cifra o ajústala antes de confirmar.
      </p>
      <div className="paso-cierre__campos">
      {Object.keys(EXPENSE_CATEGORY_LABELS).map((clave) => (
        <label className="campo" key={clave}>
          <span className="campo__etiqueta">{EXPENSE_CATEGORY_LABELS[clave as keyof typeof EXPENSE_CATEGORY_LABELS]}</span>
          <input
            type="text"
            inputMode="decimal"
            value={textos[clave] ?? ''}
            onChange={(evento) => alCambiar(clave, evento.target.value)}
          />
          {errores[`gasto:${clave}`] ? (
            <small className="campo__error" role="alert">
              {errores[`gasto:${clave}`]}
            </small>
          ) : null}
        </label>
      ))}
      </div>
      <p className="paso-cierre__total">
        Total presupuestado: <strong>{formatoMoneda(total, moneda)}</strong>
      </p>
    </fieldset>
  );
}
