// Paso 1 del wizard (REQ-16-01): repaso de la evolución del flujo de
// caja y del patrimonio actual antes de tomar decisiones.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { ResumenCierre } from '../../domain/entities/cierre.ts';
import { etiquetaMes, etiquetaMesCorta } from '../../domain/use-cases/etiqueta-mes.ts';

interface Props {
  readonly resumen: ResumenCierre;
}

/** Tabla de flujo mensual y tarjeta de patrimonio del mes a cerrar. */
export function PasoRepaso({ resumen }: Props) {
  const moneda = usarMoneda();
  const { patrimonio, flujo } = resumen;
  return (
    <div className="paso-cierre">
      <h3 className="paso-cierre__titulo">Repaso de {etiquetaMes(resumen.mes)}</h3>
      <div className="tabla-contenedor"><table className="tabla">
        <thead>
          <tr>
            <th scope="col">Mes</th>
            <th scope="col" className="num">Ingresos</th>
            <th scope="col" className="num">Gastos</th>
            <th scope="col" className="num">Utilidad</th>
          </tr>
        </thead>
        <tbody>
          {flujo.map((fila) => (
            <tr key={fila.mes}>
              <th scope="row">{etiquetaMesCorta(fila.mes)}</th>
              <td className="num">{formatoMoneda(fila.ingresos, moneda)}</td>
              <td className="num">{formatoMoneda(fila.gastos, moneda)}</td>
              <td className="num">{formatoMoneda(fila.utilidad, moneda)}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      <dl className="rejilla rejilla--3 paso-cierre__kpis">
        <div className="kpi"><dt className="kpi__etiqueta">Activos</dt><dd className="kpi__valor">{formatoMoneda(patrimonio.activos, moneda)}</dd></div>
        <div className="kpi"><dt className="kpi__etiqueta">Pasivos</dt><dd className="kpi__valor">{formatoMoneda(patrimonio.pasivos, moneda)}</dd></div>
        <div className="kpi"><dt className="kpi__etiqueta">Patrimonio</dt><dd className="kpi__valor">{formatoMoneda(patrimonio.patrimonio, moneda)}</dd></div>
      </dl>
    </div>
  );
}
