// Paso 1 del wizard (REQ-16-01): repaso de la evolución del flujo de
// caja y del patrimonio actual antes de tomar decisiones.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { ResumenCierre } from '../../domain/entities/cierre.ts';
import '../../styles/pasos-wizard.css';

interface Props {
  readonly resumen: ResumenCierre;
}

/** Tabla de flujo mensual y tarjeta de patrimonio del mes a cerrar. */
export function PasoRepaso({ resumen }: Props) {
  const moneda = usarMoneda();
  const { patrimonio, flujo } = resumen;
  return (
    <div className="paso-repaso">
      <h3 className="paso-repaso__titulo">Repaso de {resumen.mes}</h3>
      <table className="paso-repaso__tabla">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col">Ingresos</th>
            <th scope="col">Gastos</th>
            <th scope="col">Utilidad</th>
          </tr>
        </thead>
        <tbody>
          {flujo.map((fila) => (
            <tr key={fila.mes}>
              <th scope="row">{fila.mes}</th>
              <td>{formatoMoneda(fila.ingresos, moneda)}</td>
              <td>{formatoMoneda(fila.gastos, moneda)}</td>
              <td>{formatoMoneda(fila.utilidad, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="paso-repaso__patrimonio">
        <dt>Activos</dt>
        <dd>{formatoMoneda(patrimonio.activos, moneda)}</dd>
        <dt>Pasivos</dt>
        <dd>{formatoMoneda(patrimonio.pasivos, moneda)}</dd>
        <dt>Patrimonio</dt>
        <dd>{formatoMoneda(patrimonio.patrimonio, moneda)}</dd>
      </dl>
    </div>
  );
}
