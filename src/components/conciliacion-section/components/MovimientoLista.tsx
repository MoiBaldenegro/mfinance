// REQ-13-01..07: lista de movimientos de una cuenta.
import type { Movement } from '../../../domain/entities/account-statement.ts';
import { formatearImporte } from '../../../domain/use-cases/conciliacion-logic.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';
import '../../../styles/movimiento-lista.css';

interface Props {
  readonly movimientos: readonly Movement[];
}

export function MovimientoLista({ movimientos }: Props) {
  const moneda = usarMoneda();
  if (movimientos.length === 0) {
    return (
      <p className="movimiento-lista__vacio">Sin movimientos registrados</p>
    );
  }

  return (
    <ul className="movimiento-lista">
      {movimientos.map((mov, idx) => (
        <li key={idx} className="movimiento-lista__item">
          <span className="movimiento-lista__fecha">{mov.fecha}</span>
          <span className="movimiento-lista__concepto">{mov.concepto}</span>
          <span className={`movimiento-lista__importe ${mov.importe >= 0 ? 'positivo' : 'negativo'}`}>
            {formatearImporte(mov.importe, moneda)}
          </span>
        </li>
      ))}
    </ul>
  );
}
