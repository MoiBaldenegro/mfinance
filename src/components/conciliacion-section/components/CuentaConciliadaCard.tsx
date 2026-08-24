// REQ-13-01..07: tarjeta de una cuenta en conciliación.
import { useState } from 'react';
import type { Movement } from '../../../domain/entities/account-statement.ts';
import { formatearImporte, claseEstadoConciliada, textoEstadoConciliada } from '../../../domain/use-cases/conciliacion-logic.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';
import { MovimientoLista } from './MovimientoLista.tsx';
import { MovimientoFormulario } from './MovimientoFormulario.tsx';
import '../../../styles/cuenta-conciliada-card.css';

interface Props {
  readonly cuenta: {
    readonly cuenta: string;
    readonly saldo_inicial: number;
    readonly movimientos: readonly Movement[];
    readonly saldo_final: number;
    readonly saldo_teorico: number;
    readonly diferencia: number;
    readonly conciliada: boolean;
  };
  readonly onAgregarMovimiento: (e: React.FormEvent<HTMLFormElement>, cuenta: string) => void;
  readonly guardando: boolean;
  readonly errorAgregar: string | null;
}

export function CuentaConciliadaCard({ cuenta, onAgregarMovimiento, guardando, errorAgregar }: Props) {
  const [mostrarMovimientos, setMostrarMovimientos] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const moneda = usarMoneda();

  return (
    <article className={`cuenta-conciliada-card ${cuenta.conciliada ? 'conciliada' : 'descuadrada'}`}>
      <header className="cuenta-conciliada-card__header">
        <h3 className="cuenta-conciliada-card__nombre">{cuenta.cuenta}</h3>
        <span className={`cuenta-conciliada-card__estado ${claseEstadoConciliada(cuenta.conciliada)}`}>
          {textoEstadoConciliada(cuenta.conciliada)}
        </span>
      </header>

      <dl className="cuenta-conciliada-card__resumen">
        <div className="cuenta-conciliada-card__campo">
          <dt>Saldo inicial</dt><dd>{formatearImporte(cuenta.saldo_inicial, moneda)}</dd>
        </div>
        <div className="cuenta-conciliada-card__campo">
          <dt>Saldo teórico</dt><dd>{formatearImporte(cuenta.saldo_teorico, moneda)}</dd>
        </div>
        <div className="cuenta-conciliada-card__campo">
          <dt>Saldo real (banco)</dt><dd>{formatearImporte(cuenta.saldo_final, moneda)}</dd>
        </div>
        <div className={`cuenta-conciliada-card__campo cuenta-conciliada-card__campo--diferencia ${cuenta.diferencia < 0 ? 'negativa' : 'positiva'}`}>
          <dt>Diferencia</dt>
          <dd>{formatearImporte(cuenta.diferencia, moneda)}</dd>
        </div>
      </dl>

      {!cuenta.conciliada && (
        <div className="cuenta-conciliada-card__ajuste">
          <label>
            Ajuste para cuadrar:
            <input
              type="number"
              step="0.01"
              value={Math.abs(cuenta.diferencia).toFixed(2)}
              readOnly
              className="cuenta-conciliada-card__input-ajuste"
            />
            <span className="cuenta-conciliada-card__ajuste-nota">
              {cuenta.diferencia < 0
                ? `Faltan ${formatearImporte(Math.abs(cuenta.diferencia), moneda)} para cuadrar`
                : `Sobran ${formatearImporte(cuenta.diferencia, moneda)} para cuadrar`}
            </span>
          </label>
        </div>
      )}

      <details className="cuenta-conciliada-card__movimientos" open={mostrarMovimientos}>
        <summary onClick={() => setMostrarMovimientos(!mostrarMovimientos)}>
          Movimientos ({cuenta.movimientos.length})
        </summary>
        <MovimientoLista movimientos={cuenta.movimientos} />
        <button
          type="button"
          className="cuenta-conciliada-card__btn-nuevo-movimiento"
          onClick={() => setMostrarFormulario(true)}
        >
          + Registrar movimiento
        </button>
      </details>

      {mostrarFormulario && (
        <MovimientoFormulario
          cuenta={cuenta.cuenta}
          onSubmit={onAgregarMovimiento}
          guardando={guardando}
          error={errorAgregar}
          onCancel={() => setMostrarFormulario(false)}
        />
      )}
    </article>
  );
}