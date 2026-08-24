// REQ-27-07: aviso efímero de bienvenida / confirmación. Presentacional:
// el estado vive en usarToast() dentro de la shell.
import '../../styles/toast-aviso.css';

interface Props {
  readonly mensaje: string | null;
}

/** Toast global en la esquina inferior; role=status para lectores. */
export function ToastAviso({ mensaje }: Props) {
  if (!mensaje) return null;
  return (
    <div className="toast-aviso" role="status" aria-live="polite">
      <p className="toast-aviso__texto">{mensaje}</p>
    </div>
  );
}
