// Aviso y acción de reapertura cuando el mes seleccionado en Registro
// está cerrado (REQ-16-07): delega en el hook useReapertura.
import {
  avisoMesCerrado,
} from '../../domain/use-cases/mes-cerrado.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import { useReapertura } from '../cierre-section/use-reapertura.ts';
import '../../styles/registro-section.css';

interface Props {
  /** Mes cerrado seleccionado (YYYY-MM). */
  readonly mes: string;
}

/** Aviso de solo lectura con botón «Reabrir mes» explícito. */
export function BloqueoCierre({ mes }: Props) {
  const { aplicarSnapshot } = useSnapshot();
  const { ocupado, aviso, reabrir } = useReapertura(aplicarSnapshot);
  return (
    <div className="registro-section__cierre">
      <p className="registro-section__aviso" role="alert">
        {avisoMesCerrado(mes)}
      </p>
      <button
        type="button"
        className="registro-section__reabrir"
        disabled={ocupado}
        onClick={() => void reabrir(mes)}
      >
        {ocupado ? 'Reabriendo…' : 'Reabrir mes'}
      </button>
      {aviso ? (
        <p className="registro-section__aviso" role="alert">{aviso}</p>
      ) : null}
    </div>
  );
}
