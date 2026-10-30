// Tabla de valor futuro por familia a 5, 10 y 20 años.
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import { etiquetaFamiliaProyeccion, formatearProyeccion } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';

interface Props {
  readonly proyeccion: ProyeccionInversiones | null;
}

export function ProyeccionResumen({ proyeccion }: Props) {
  const moneda = usarMoneda();
  if (!proyeccion) return null;
  return (
    <div className="tabla-contenedor">
      <table className="tabla">
        <thead>
          <tr>
            <th>Familia</th><th className="num">5 años</th><th className="num">10 años</th><th className="num">20 años</th>
          </tr>
        </thead>
        <tbody>
          {proyeccion.familias.map((fam) => (
            <tr key={fam.familia}>
              <th scope="row">{etiquetaFamiliaProyeccion(fam.familia)}</th>
              <td className="num">{formatearProyeccion(fam.valor_futuro_5, moneda)}</td>
              <td className="num">{formatearProyeccion(fam.valor_futuro_10, moneda)}</td>
              <td className="num">{formatearProyeccion(fam.valor_futuro_20, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
