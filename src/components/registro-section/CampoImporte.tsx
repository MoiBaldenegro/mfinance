// REQ-06-02/03/06: campo numérico de importe (step 0.01 con el sufijo
// del símbolo de la moneda activa, REQ-20-05) controlado desde el estado
// del formulario, con hueco para el error de validación inline.
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/campo-importe.css';

interface Props {
  /** Prefijo de id único por tarjeta (ingreso|gasto). */
  readonly prefijo: string;
  /** Clave del catálogo (p. ej. "Salario", "Vivienda"). */
  readonly clave: string;
  /** Rótulo fijo visible en español. */
  readonly etiqueta: string;
  /** Texto tecleado que controla el input. */
  readonly texto: string;
  /** Mensaje de validación en español; ausente si el campo es válido. */
  readonly error?: string;
  /** Avisa el nuevo texto tecleado para esta clave. */
  readonly alCambiar: (clave: string, texto: string) => void;
}

/** Importe editable en la moneda activa, con error inline bajo el campo. */
export function CampoImporte({
  prefijo,
  clave,
  etiqueta,
  texto,
  error,
  alCambiar,
}: Props) {
  const id = `${prefijo}-${clave}`;
  const idError = `${id}-error`;
  const simbolo = simboloDe(usarMoneda());
  return (
    <div className={error ? 'campo-importe campo-importe--invalido' : 'campo-importe'}>
      <label className="campo-importe__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <span className="campo-importe__control">
        <input
          id={id}
          className="campo-importe__entrada"
          type="number"
          step="0.01"
          min="0"
          inputMode="decimal"
          value={texto}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? idError : undefined}
          onChange={(evento) => alCambiar(clave, evento.target.value)}
        />
        <span className="campo-importe__sufijo" aria-hidden="true">{simbolo}</span>
      </span>
      {error ? (
        <p className="campo-importe__error" id={idError} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
