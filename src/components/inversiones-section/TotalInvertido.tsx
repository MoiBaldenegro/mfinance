// Total invertido al mes (REQ-11-06) en la moneda activa (REQ-20-05).
import { formatearProyeccion } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/inversiones-total.css';

interface Props {
  readonly total: number;
}

export function TotalInvertido({ total }: Props) {
  const moneda = usarMoneda();
  return (
    <div className="inversiones-total">
      <strong>Total invertido al mes: </strong>
      <span>{formatearProyeccion(total, moneda)}</span>
    </div>
  );
}
