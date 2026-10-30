// Histórico de cierres consultable (REQ-16-08): tabla de meses cerrados
// con fecha del cierre y presupuesto decidido, desde el snapshot cargado.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { resumenesHistorico } from '../../domain/use-cases/cierre-historico.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Tabla de los cierres de meses anteriores persistidos. */
export function HistoricoCierres({ snapshot }: Props) {
  const moneda = usarMoneda();
  const historico = resumenesHistorico(snapshot);
  return (
    <section className="card" aria-label="Cierres anteriores">
      <h2 className="card__titulo">Cierres anteriores</h2>
      {historico.length === 0 ? (
        <p className="card__descripcion">
          Todavía no hay ningún mes cerrado.
        </p>
      ) : (
        <div className="tabla-contenedor"><table className="tabla">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Fecha de cierre</th>
              <th scope="col" className="num">Presupuesto siguiente</th>
            </tr>
          </thead>
          <tbody>
            {historico.map((fila) => (
              <tr key={fila.mes}>
                <th scope="row">{fila.mes}</th>
                <td>{fila.fecha}</td>
                <td className="num">{formatoMoneda(fila.totalPresupuesto, moneda)}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </section>
  );
}
