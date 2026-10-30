// Lista de movimientos de una cuenta.
import type { Movement } from '../../../domain/entities/account-statement.ts';
import { formatearImporte } from '../../../domain/use-cases/conciliacion-logic.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';

interface Props {
  readonly movimientos: readonly Movement[];
}

export function MovimientoLista({ movimientos }: Props) {
  const moneda = usarMoneda();
  if (movimientos.length === 0) {
    return <p className="card__descripcion">Sin movimientos registrados este mes.</p>;
  }
  return (
    <ul className="movimiento-lista">
      {movimientos.map((mov, idx) => (
        <li key={`${mov.fecha}-${idx}`} className="movimiento-lista__item">
          <span className="movimiento-lista__fecha num">{mov.fecha}</span>
          <span className="movimiento-lista__concepto">{mov.concepto}</span>
          <span className={mov.importe >= 0 ? 'num positivo' : 'num'}>{formatearImporte(mov.importe, moneda)}</span>
        </li>
      ))}
    </ul>
  );
}
