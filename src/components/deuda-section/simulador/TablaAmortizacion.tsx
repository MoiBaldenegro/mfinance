// Acordeón con la tabla de amortización mes a mes (REQ-15-06): capital,
// interés, saldo y total acumulado, colapsado por defecto (design.md).
import type { FilaTablaAmortizacion } from '../../../domain/use-cases/simulador-comparativa.ts';

interface Props {
  readonly titulo: string;
  readonly filas: readonly FilaTablaAmortizacion[];
}

export function TablaAmortizacion({ titulo, filas }: Props) {
  return (
    <details className="simulador-amortizacion">
      <summary>Tabla de amortización — {titulo}</summary>
      <div className="tabla-contenedor simulador-amortizacion__scroll">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col" className="num">Cuota</th>
              <th scope="col" className="num">Interés</th>
              <th scope="col" className="num">Capital</th>
              <th scope="col" className="num">Saldo</th>
              <th scope="col" className="num">Total acum.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.mes}>
                <td>{fila.mes}</td>
                <td className="num">{fila.cuota}</td>
                <td className="num">{fila.interes}</td>
                <td className="num">{fila.capital}</td>
                <td className="num">{fila.saldoRestante}</td>
                <td className="num">{fila.totalAcumulado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
