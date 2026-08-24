// REQ-08-01/02/03/04/05/06/07: sección Balance completa con CRUD
// de activos/pasivos, tarjetas resumen, gráfica evolución patrimonio
// y validaciones negativos con refresco automático.
import { useBalance } from './use-balance.ts';
import { BalanceCards } from './BalanceCards.tsx';
import { BalanceChart } from './BalanceChart.tsx';
import { BalanceTable } from './BalanceTable.tsx';
import { estaVacio, MENSAJE_SIN_PATRIMONIO } from '../../domain/use-cases/balance-vacio.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import '../../styles/balance-section.css';

/** Sección Balance completa: listas editables, resumen y gráfica. */
export function BalanceSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const {
    balance,
    totales,
    cargando,
    error,
    assetUpsert,
    assetEliminar,
    liabilityUpsert,
    liabilityEliminar,
  } = useBalance();

  // Usar la serie del hook si está cargada
  const serie = balance?.serie;

  // Para la tabla, usamos el snapshot del props para las listas
  // (que se actualiza tras cada operación vía aplicarSnapshot).
  const listaActivos = snapshot.assets;
  const listaPasivos = snapshot.liabilities;

  const ocupada = cargando;

  if (cargando) {
    return (
      <section className="balance-section">
        <h2 className="balance-section__titulo">Balance</h2>
        <p className="balance-section__cargando estado-carga">Cargando balance…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="balance-section">
        <h2 className="balance-section__titulo">Balance</h2>
        <div className="balance-section__error" role="alert">
          {error}
          <button className="btn btn--secundario" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="balance-section">
      <h2 className="balance-section__titulo">Balance</h2>

      {/* TARJETAS RESUMEN - REQ-08-04 */}
      <BalanceCards totales={totales} />

      {/* GRÁFICA EVOLUCIÓN PATRIMONIO - REQ-08-05 */}
      <div className="balance-grafica-wrapper">
        {serie && !estaVacio(serie) ? (
          <BalanceChart serie={serie} />
        ) : (
          <div className="balance-grafica--vacia estado-vacio" role="status">
            {MENSAJE_SIN_PATRIMONIO}
          </div>
        )}
      </div>

      {/* TABLAS EDITABLES ACTIVOS Y PASIVOS - REQ-08-01/02 */}
      <BalanceTable
        activos={listaActivos}
        pasivos={listaPasivos}
        onAssetUpsert={assetUpsert}
        onAssetEliminar={assetEliminar}
        onLiabilityUpsert={liabilityUpsert}
        onLiabilityEliminar={liabilityEliminar}
        ocupando={ocupada}
      />
    </section>
  );
}