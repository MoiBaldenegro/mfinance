// REQ-14-04: tabla de balance futuro distinguiendo histórico vs proyectado
// mediante clase CSS (fondo/icono distinto).
import type { FilaTablaBalanceFuturo } from '../../domain/use-cases/balance-futuro-tabla.ts';
import '../../styles/tabla-balance-futuro.css';

interface Props {
  readonly filas: readonly FilaTablaBalanceFuturo[];
}

export function TablaBalanceFuturo({ filas }: Props) {
  return (
    <div className="tabla-balance-futuro__wrap" role="region" aria-label="Tabla balance futuro">
      <table className="tabla-balance-futuro">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Activos</th>
            <th scope="col">Pasivos</th>
            <th scope="col">Patrimonio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className={`tabla-balance-futuro__fila tabla-balance-futuro__fila--${fila.tipo}`}>
              <td className="tabla-balance-futuro__celda--mes">
                <span className={`tabla-balance-futuro__badge tabla-balance-futuro__badge--${fila.tipo}`}>
                  {fila.tipo === 'historico' ? 'Real' : 'Proyectado'}
                </span>
                {fila.mes}
              </td>
              <td className="tabla-balance-futuro__celda--importe">{fila.activos}</td>
              <td className="tabla-balance-futuro__celda--importe">{fila.pasivos}</td>
              <td className="tabla-balance-futuro__celda--importe">{fila.patrimonio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}