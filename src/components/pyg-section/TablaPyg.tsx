// REQ-07-02: tabla mes a mes de la sección P&G con columnas mes,
// ingresos, gastos, utilidad y ahorro acumulado en formato europeo.
import { etiquetaMesCorta } from '../../domain/use-cases/etiqueta-mes.ts';
import type { FilaTablaPyg } from '../../domain/use-cases/pyg-tabla.ts';

const CABECERAS = [
  'Mes',
  'Ingresos',
  'Gastos',
  'Utilidad',
  'Ahorro acumulado',
] as const;

interface Props {
  readonly filas: readonly FilaTablaPyg[];
}

/** Tabla compacta de la serie mensual P&G. */
export function TablaPyg({ filas }: Props) {
  return (
    <div className="tabla-contenedor" tabIndex={0}>
      <table className="tabla">
        <thead>
          <tr>
            {CABECERAS.map((cabecera) => (
              <th key={cabecera} scope="col" className={cabecera === 'Mes' ? undefined : 'num'}>{cabecera}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.mes}>
              <th scope="row" className="num">{etiquetaMesCorta(fila.mes)}</th>
              <td className="num">{fila.ingresos}</td>
              <td className="num">{fila.gastos}</td>
              <td
                className={fila.utilidad.startsWith('-') ? 'num negativo' : 'num positivo'}
              >
                {fila.utilidad}
              </td>
              <td className="num">{fila.ahorroAcumulado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
