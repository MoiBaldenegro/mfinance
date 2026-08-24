// REQ-14-04: tabla de proyección PyG distinguiendo histórico vs proyectado
// mediante clase CSS (fondo/icono distinto).
import type { FilaTablaProyeccion } from '../../domain/use-cases/pyg-proyeccion-tabla.ts';
import '../../styles/tabla-proyeccion.css';

interface Props {
  readonly filas: readonly FilaTablaProyeccion[];
}

export function TablaProyeccion({ filas }: Props) {
  return (
    <div className="tabla-proyeccion__wrap" role="region" aria-label="Tabla proyección PyG">
      <table className="tabla-proyeccion">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Ingresos</th>
            <th scope="col">Gastos</th>
            <th scope="col">Utilidad</th>
            <th scope="col">Ahorro acumulado</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className={`tabla-proyeccion__fila tabla-proyeccion__fila--${fila.tipo}`}>
              <td className="tabla-proyeccion__celda--mes">
                <span className={`tabla-proyeccion__badge tabla-proyeccion__badge--${fila.tipo}`}>
                  {fila.tipo === 'historico' ? 'Real' : 'Proyectado'}
                </span>
                {fila.mes}
              </td>
              <td className="tabla-proyeccion__celda--importe">{fila.ingresos}</td>
              <td className="tabla-proyeccion__celda--importe">{fila.gastos}</td>
              <td className="tabla-proyeccion__celda--importe">{fila.utilidad}</td>
              <td className="tabla-proyeccion__celda--importe">{fila.ahorroAcumulado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}