// Acordeón con la tabla de amortización mes a mes (REQ-15-06): capital,
// interés, saldo y total acumulado, colapsado por defecto (design.md).
import type { FilaTablaAmortizacion } from '../../../domain/use-cases/simulador-comparativa.ts';
import '../../../styles/simulador-amortizacion.css';

interface Props {
  readonly titulo: string;
  readonly filas: readonly FilaTablaAmortizacion[];
}

export function TablaAmortizacion({ titulo, filas }: Props) {
  return (
    <details className="simulador-amortizacion">
      <summary>Tabla de amortización — {titulo}</summary>
      <div className="simulador-amortizacion__scroll">
        <table className="simulador-tabla">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Cuota</th>
              <th scope="col">Interés</th>
              <th scope="col">Capital</th>
              <th scope="col">Saldo</th>
              <th scope="col">Total acum.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.mes}>
                <td>{fila.mes}</td>
                <td>{fila.cuota}</td>
                <td>{fila.interes}</td>
                <td>{fila.capital}</td>
                <td>{fila.saldoRestante}</td>
                <td>{fila.totalAcumulado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
