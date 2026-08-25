// REQ-05-07 + REQ-37-01/02 + REQ-38-06: error sin datos financieros.
import type { SnapshotLoadError } from '../../domain/errors/snapshot-errors.ts';
import '../../styles/error-screen.css';

interface Props {
  readonly error: SnapshotLoadError;
  readonly reintentar?: () => void;
  readonly alGestionarPerfiles?: () => void;
  readonly alRegresarAjustes?: () => void;
  readonly alVolverPerfilAnterior?: () => void;
}

/** Diagnóstico recuperable; la gestión no recibe ningún snapshot. */
export function ErrorScreen({ error, reintentar, alGestionarPerfiles, alRegresarAjustes,
  alVolverPerfilAnterior }: Props) {
  const gestionar = alGestionarPerfiles ?? alRegresarAjustes ?? (() => {});
  return (
    <div className="error-screen" role="alert">
      <h1 className="error-screen__titulo">No se pudieron cargar tus datos</h1>
      <p className="error-screen__mensaje">{error.message}</p>
      {reintentar ? <button
        type="button"
        className="error-screen__boton"
        onClick={reintentar}
      >
        Reintentar
      </button> : null}
      <button
        type="button"
        className="error-screen__boton"
        aria-label="Gestionar perfiles (Regresar a Ajustes)"
        onClick={gestionar}
      >
        Gestionar perfiles
      </button>
      {alVolverPerfilAnterior ? <button type="button" className="error-screen__boton"
        onClick={alVolverPerfilAnterior}>Volver al perfil anterior</button> : null}
    </div>
  );
}
