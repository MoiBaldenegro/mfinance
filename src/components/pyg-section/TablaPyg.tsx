// REQ-07-02: tabla mes a mes de la sección P&G con columnas mes,
// ingresos, gastos, utilidad y ahorro acumulado en formato europeo.
import type { FilaTablaPyg } from '../../domain/use-cases/pyg-tabla.ts';
import '../../styles/tabla-pyg.css';

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
    <div className="tabla-pyg__scroll" tabIndex={0}>
      <table className="tabla-pyg">
        <thead>
          <tr>
            {CABECERAS.map((cabecera) => (
              <th key={cabecera} scope="col">{cabecera}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.mes}>
              <th scope="row">{fila.mes}</th>
              <td>{fila.ingresos}</td>
              <td>{fila.gastos}</td>
              <td
                className={fila.utilidad.startsWith('-')
                  ? 'tabla-pyg__negativo'
                  : 'tabla-pyg__positivo'}
              >
                {fila.utilidad}
              </td>
              <td>{fila.ahorroAcumulado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
