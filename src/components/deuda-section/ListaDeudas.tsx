// Lista de deudas con objetivo destacado para la sección Deuda.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import '../../styles/deuda-lista.css';

interface DeudaItem {
  readonly nombre: string;
  readonly saldo_pendiente: number;
  readonly tasa_interes_anual: number;
  readonly pago_minimo_mensual: number;
}

interface Props {
  readonly deudas: readonly DeudaItem[];
  readonly deudaObjetivo: { readonly nombre: string } | null;
  readonly estrategia: DebtStrategy;
}

export function ListaDeudas({ deudas, deudaObjetivo, estrategia }: Props) {
  const moneda = usarMoneda();
  return (
    <section className="deuda-section__tarjeta" aria-label="Lista de deudas">
      <h3 className="deuda-section__subtitulo">
        Tus deudas ordenadas por {estrategia === 'Avalanche' ? 'tasa (avalancha)' : 'saldo (bola de nieve)'}
      </h3>
      <ul className="deuda-section__lista">
        {deudas.map((deuda) => {
          const esObjetivo = deudaObjetivo?.nombre === deuda.nombre;
          return (
            <li key={deuda.nombre} className={`deuda-section__item${esObjetivo ? ' deuda-section__item--objetivo' : ''}`}>
              <div className="deuda-section__item-info">
                <span className="deuda-section__item-nombre">{deuda.nombre}</span>
                {esObjetivo && <span className="deuda-section__badge">OBJETIVO</span>}
              </div>
              <div className="deuda-section__item-detalles">
                <span>Saldo: {formatoMoneda(deuda.saldo_pendiente, moneda)}</span>
                <span>Tasa: {deuda.tasa_interes_anual.toFixed(2)} %</span>
                <span>Pago mínimo: {formatoMoneda(deuda.pago_minimo_mensual, moneda)}/mes</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}