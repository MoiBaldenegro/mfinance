// REQ-14-04: tabla de balance futuro distinguiendo histórico vs proyectado
// mediante clase CSS (fondo/icono distinto).
import type { FilaTablaBalanceFuturo } from '../../domain/use-cases/balance-futuro-tabla.ts';
import { etiquetaMesCorta } from '../../domain/use-cases/etiqueta-mes.ts';

interface Props {
  readonly filas: readonly FilaTablaBalanceFuturo[];
}

export function TablaBalanceFuturo({ filas }: Props) {
  return (
    <div className="tabla-contenedor" role="region" aria-label="Tabla balance futuro">
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col" className="num">Activos</th>
            <th scope="col" className="num">Pasivos</th>
            <th scope="col" className="num">Patrimonio</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              <td className="tabla-mes">
                <span className="num">{etiquetaMesCorta(fila.mes)}</span>
                {fila.tipo === 'historico'
                  ? <span className="badge badge--primario">Real</span>
                  : <span className="badge">Proyectado</span>}
              </td>
              <td className="num">{fila.activos}</td>
              <td className="num">{fila.pasivos}</td>
              <td className="num">{fila.patrimonio}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}