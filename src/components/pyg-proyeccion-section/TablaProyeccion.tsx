// REQ-14-04: tabla de proyección PyG distinguiendo histórico vs proyectado
// mediante clase CSS (fondo/icono distinto).
import type { FilaTablaProyeccion } from '../../domain/use-cases/pyg-proyeccion-tabla.ts';
import { etiquetaMesCorta } from '../../domain/use-cases/etiqueta-mes.ts';

interface Props {
  readonly filas: readonly FilaTablaProyeccion[];
}

export function TablaProyeccion({ filas }: Props) {
  return (
    <div className="tabla-contenedor" role="region" aria-label="Tabla proyección PyG">
      <table className="tabla">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col" className="num">Ingresos</th>
            <th scope="col" className="num">Gastos</th>
            <th scope="col" className="num">Utilidad</th>
            <th scope="col" className="num">Ahorro acumulado</th>
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
              <td className="num">{fila.ingresos}</td>
              <td className="num">{fila.gastos}</td>
              <td className="num">{fila.utilidad}</td>
              <td className="num">{fila.ahorroAcumulado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}