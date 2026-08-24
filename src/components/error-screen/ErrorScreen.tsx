// REQ-05-07: pantalla de error nombrado en español con acción Reintentar,
// mostrada si la carga inicial del snapshot falla (nunca pantalla vacía).
import type { SnapshotLoadError } from '../../domain/errors/snapshot-errors.ts';
import '../../styles/error-screen.css';

interface Props {
  readonly error: SnapshotLoadError;
  readonly reintentar: () => void;
}

/** Error de carga inicial con el motivo y el botón Reintentar. */
export function ErrorScreen({ error, reintentar }: Props) {
  return (
    <div className="error-screen" role="alert">
      <h1 className="error-screen__titulo">No se pudieron cargar tus datos</h1>
      <p className="error-screen__mensaje">{error.message}</p>
      <button
        type="button"
        className="error-screen__boton"
        onClick={reintentar}
      >
        Reintentar
      </button>
    </div>
  );
}
