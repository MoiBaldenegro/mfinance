// Deudas en el orden de ataque de la estrategia, con la objetivo destacada.
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { formatoPorcentaje } from '../../domain/use-cases/formato-porcentaje.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';

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
    <section className="card" aria-label="Orden de pago">
      <div className="card__cabecera">
        <h2 className="card__titulo">Orden de pago</h2>
        <span className="card__descripcion">
          Por {estrategia === 'Avalanche' ? 'tasa de interés' : 'saldo pendiente'}
        </span>
      </div>
      <ol className="deuda-lista">
        {deudas.map((deuda, i) => {
          const objetivo = deudaObjetivo?.nombre === deuda.nombre;
          return (
            <li key={deuda.nombre} className={objetivo ? 'deuda-lista__item deuda-lista__item--objetivo' : 'deuda-lista__item'}>
              <span className="deuda-lista__orden">{i + 1}</span>
              <div className="deuda-lista__info">
                <span className="deuda-lista__nombre">
                  {deuda.nombre}
                  {objetivo ? <span className="badge badge--primario">Objetivo</span> : null}
                </span>
                <span className="deuda-lista__detalle">
                  {formatoPorcentaje(deuda.tasa_interes_anual, moneda, 2)} anual ·
                  mínimo {formatoMoneda(deuda.pago_minimo_mensual, moneda)}/mes
                </span>
              </div>
              <span className="num deuda-lista__saldo">{formatoMoneda(deuda.saldo_pendiente, moneda)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
