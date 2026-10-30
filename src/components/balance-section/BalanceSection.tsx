// Sección Balance: KPIs de activos/pasivos/patrimonio, evolución del
// patrimonio y CRUD de activos y pasivos.
import { useBalance } from './use-balance.ts';
import { BalanceCards } from './BalanceCards.tsx';
import { BalanceChart } from './BalanceChart.tsx';
import { ActivosTable } from './ActivosTable.tsx';
import { PasivosTable } from './PasivosTable.tsx';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { estaVacio, MENSAJE_SIN_PATRIMONIO } from '../../domain/use-cases/balance-vacio.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { Pestanas } from '../ui/Pestanas.tsx';
import '../../styles/balance-section.css';

const DESCRIPCION = 'Lo que tienes, lo que debes y cómo evoluciona tu patrimonio.';

/** Sección Balance completa. */
export function BalanceSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const balance = useBalance();
  const serie = balance.balance?.serie;
  return (
    <section className="pagina balance-section">
      <CabeceraPagina titulo="Balance" descripcion={DESCRIPCION} />
      {balance.cargando ? <p className="estado-carga">Cargando balance…</p> : null}
      {balance.errorCarga ? (
        <div className="aviso aviso--error balance-section__aviso" role="alert">
          <p>No se pudo cargar el balance: {balance.errorCarga}</p>
          <button type="button" className="btn btn--sm" onClick={() => void balance.reintentar()}>Reintentar</button>
        </div>
      ) : null}
      <BalanceCards totales={balance.totales} />
      {balance.errorOperacion ? (
        <p className="aviso aviso--error" role="alert">{balance.errorOperacion}</p>
      ) : null}
      <Pestanas id="balance" etiqueta="Vistas del balance" pestanas={[
        { id: 'detalle', titulo: 'Activos y pasivos',
          insignia: String(snapshot.assets.length + snapshot.liabilities.length),
          contenido: (
            <div className="rejilla rejilla--2 balance-section__tablas">
              <ActivosTable activos={snapshot.assets} onUpsert={balance.assetUpsert}
                onEliminar={balance.assetEliminar} ocupando={balance.ocupado} />
              <PasivosTable pasivos={snapshot.liabilities} onUpsert={balance.liabilityUpsert}
                onEliminar={balance.liabilityEliminar} ocupando={balance.ocupado} />
            </div>
          ) },
        { id: 'evolucion', titulo: 'Evolución', contenido: (
          <section className="card" aria-label="Evolución del patrimonio">
            <h2 className="card__titulo">Evolución del patrimonio</h2>
            {serie && !estaVacio(serie)
              ? <BalanceChart serie={serie} />
              : <p className="estado-vacio" role="status">{MENSAJE_SIN_PATRIMONIO}</p>}
          </section>
        ) },
      ]} />
    </section>
  );
}
