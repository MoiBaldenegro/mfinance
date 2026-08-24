// REQ-08-01/02: wrapper que compone ActivosTable y PasivosTable.
import { ActivosTable } from './ActivosTable.tsx';
import { PasivosTable } from './PasivosTable.tsx';
import type { Asset } from '../../domain/entities/asset.ts';
import type { Liability } from '../../domain/entities/liability.ts';
import type { CategoriaActivo } from '../../domain/entities/asset.ts';
import '../../styles/balance-table.css';

interface Props {
  readonly activos: readonly Asset[];
  readonly pasivos: readonly Liability[];
  readonly onAssetUpsert: (
    nombre: string,
    categoria: CategoriaActivo,
    valorActual: number,
  ) => Promise<void>;
  readonly onAssetEliminar: (nombre: string) => Promise<void>;
  readonly onLiabilityUpsert: (
    nombre: string,
    saldoPendiente: number,
    tasaInteresAnual: number,
  ) => Promise<void>;
  readonly onLiabilityEliminar: (nombre: string) => Promise<void>;
  readonly ocupando: boolean;
}

export function BalanceTable({
  activos,
  pasivos,
  onAssetUpsert,
  onAssetEliminar,
  onLiabilityUpsert,
  onLiabilityEliminar,
  ocupando,
}: Props) {
  return (
    <section className="balance-table-section">
      <ActivosTable
        activos={activos}
        onUpsert={onAssetUpsert}
        onEliminar={onAssetEliminar}
        ocupando={ocupando}
      />
      <PasivosTable
        pasivos={pasivos}
        onUpsert={onLiabilityUpsert}
        onEliminar={onLiabilityEliminar}
        ocupando={ocupando}
      />
    </section>
  );
}