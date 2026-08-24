// Resumen de proyección en tabla (REQ-11-02/07).
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import { formatearProyeccion } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/inversiones-resumen.css';

interface Props {
  readonly proyeccion: ProyeccionInversiones | null;
}

export function ProyeccionResumen({ proyeccion }: Props) {
  const moneda = usarMoneda();
  if (!proyeccion) return null;
  return (
    <div className="inversiones-resumen">
      <h3>Proyección valor futuro</h3>
      <table className="inversiones-resumen__tabla">
        <thead>
          <tr>
            <th>Familia</th>
            <th>5 años</th>
            <th>10 años</th>
            <th>20 años</th>
          </tr>
        </thead>
        <tbody>
          {proyeccion.familias.map((fam) => (
            <tr key={fam.familia}>
              <td>{fam.familia.replace('_', ' ')}</td>
              <td>{formatearProyeccion(fam.valor_futuro_5, moneda)}</td>
              <td>{formatearProyeccion(fam.valor_futuro_10, moneda)}</td>
              <td>{formatearProyeccion(fam.valor_futuro_20, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}