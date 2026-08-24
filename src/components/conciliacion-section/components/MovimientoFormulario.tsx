// REQ-13-01..07: formulario para agregar un movimiento.
import '../../../styles/movimiento-formulario.css';

interface Props {
  readonly cuenta: string;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>, cuenta: string) => void;
  readonly guardando: boolean;
  readonly error: string | null;
  readonly onCancel: () => void;
}

export function MovimientoFormulario({ cuenta, onSubmit, guardando, error, onCancel }: Props) {
  return (
    <form
      className="movimiento-formulario"
      onSubmit={(e) => onSubmit(e, cuenta)}
    >
      <input type="date" name="fecha" required className="movimiento-formulario__input" />
      <input type="text" name="concepto" placeholder="Concepto" required className="movimiento-formulario__input" />
      <input type="number" name="importe" step="0.01" placeholder="Importe (ej: -25.50)" required className="movimiento-formulario__input" />
      <div className="movimiento-formulario__acciones">
        <button type="submit" disabled={guardando} className="movimiento-formulario__btn-guardar">
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="movimiento-formulario__btn-cancelar">
          Cancelar
        </button>
      </div>
      {error && <p className="movimiento-formulario__error">{error}</p>}
    </form>
  );
}