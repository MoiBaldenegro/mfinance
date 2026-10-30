// Tabla de proyección mes a mes del plan de deuda.
interface FilaTabla {
  readonly mes: string;
  readonly saldoRestante: string;
  readonly pagoTotal: string;
  readonly intereses: string;
  readonly principal: string;
}

interface Props {
  readonly filas: readonly FilaTabla[];
}

export function TablaProyeccion({ filas }: Props) {
  return (
      <div className="tabla-contenedor deuda-section__tabla">
        <table className="tabla">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col" className="num">Pago total</th>
              <th scope="col" className="num">Intereses</th>
              <th scope="col" className="num">Principal</th>
              <th scope="col" className="num">Saldo restante</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.mes}>
                <td className="num">{fila.mes}</td>
                <td className="num">{fila.pagoTotal}</td>
                <td className="num">{fila.intereses}</td>
                <td className="num">{fila.principal}</td>
                <td className="num">{fila.saldoRestante}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
}
