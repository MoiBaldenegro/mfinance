// Tabla de proyección mes a mes del plan de deuda.
import '../../styles/deuda-tabla.css';

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
    <section className="deuda-section__tarjeta" aria-label="Proyección mes a mes">
      <h3 className="deuda-section__subtitulo">Proyección mes a mes</h3>
      <div className="deuda-section__tabla-wrap">
        <table className="deuda-section__tabla">
          <thead>
            <tr>
              <th scope="col">Mes</th>
              <th scope="col">Saldo restante</th>
              <th scope="col">Pago total</th>
              <th scope="col">Intereses</th>
              <th scope="col">Principal</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.mes}>
                <td>{fila.mes}</td>
                <td>{fila.saldoRestante}</td>
                <td>{fila.pagoTotal}</td>
                <td>{fila.intereses}</td>
                <td>{fila.principal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}