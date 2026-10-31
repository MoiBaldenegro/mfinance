// Panel que sustituye al wizard cuando el mes ya está cerrado
// (REQ-16-07/08): muestra el assessment guardado y permite reabrir.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import {
  assessmentDeMes,
  avisoMesCerrado,
} from '../../domain/use-cases/mes-cerrado.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { useReapertura } from './use-reapertura.ts';

interface Props {
  readonly mes: string;
  readonly snapshot: FinanceSnapshot;
}

/** Estado de mes cerrado con su assessment consultable y reapertura. */
export function PanelMesCerrado({ mes, snapshot }: Props) {
  const moneda = usarMoneda();
  const { aplicarSnapshot } = useSnapshot();
  const { ocupado, aviso: avisoReapertura, reabrir } = useReapertura(aplicarSnapshot);
  const assessment = assessmentDeMes(snapshot, mes);
  const total = Object.values(assessment?.presupuesto_siguiente ?? {})
    .reduce<number>((suma, valor) => suma + (valor ?? 0), 0);
  return (
    <section className="card mes-cerrado" aria-label="Mes cerrado">
      <p className="aviso aviso--exito" role="status">{avisoMesCerrado(mes)}</p>
      {assessment ? (
        <p className="card__descripcion">
          Cerrado el {assessment.fecha_cierre} · presupuesto del mes
          siguiente: <strong>{formatoMoneda(total, moneda)}</strong> ·{' '}
          {assessment.indicadores.length} indicadores archivados.
        </p>
      ) : null}
      {avisoReapertura ? (
        <p className="aviso aviso--error" role="alert">{avisoReapertura}</p>
      ) : null}
      <button
        type="button"
        className="btn mes-cerrado__accion"
        disabled={ocupado}
        onClick={() => void reabrir(mes)}
      >
        {ocupado ? 'Reabriendo…' : 'Reabrir mes'}
      </button>
    </section>
  );
}
