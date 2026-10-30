// Formulario para registrar un movimiento en una cuenta.
interface Props {
  readonly cuenta: string;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>, cuenta: string) => void;
  readonly guardando: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
}

export function MovimientoFormulario({ cuenta, onSubmit, guardando, error, onCancel }: Props) {
  return (
    <form className="movimiento-formulario" onSubmit={(e) => onSubmit(e, cuenta)}>
      <label className="campo">
        <span className="campo__etiqueta">Fecha</span>
        <input type="date" name="fecha" required />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Concepto</span>
        <input type="text" name="concepto" placeholder="Supermercado" required />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Importe</span>
        <input type="number" name="importe" step="0.01" placeholder="-25.50" required />
        <span className="campo__ayuda">Negativo para cargos, positivo para abonos.</span>
      </label>
      {error ? <p className="campo__error movimiento-formulario__fila" role="alert">{error}</p> : null}
      <div className="movimiento-formulario__fila movimiento-formulario__acciones">
        <button type="button" className="btn btn--fantasma" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
