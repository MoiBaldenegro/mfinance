// Tarjeta de una cuenta en conciliación: resumen de saldos, diferencia,
// movimientos y alta de movimiento.
import { useState } from 'react';
import type { Movement } from '../../../domain/entities/account-statement.ts';
import { formatearImporte, textoEstadoConciliada } from '../../../domain/use-cases/conciliacion-logic.ts';
import { usarMoneda } from '../../../hooks/use-moneda.ts';
import { MovimientoFormulario } from './MovimientoFormulario.tsx';
import { MovimientoLista } from './MovimientoLista.tsx';

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
  const [formulario, setFormulario] = useState(false);
  const moneda = usarMoneda();
  const importe = (n: number) => formatearImporte(n, moneda);
  return (
    <article className="card cuenta-conciliada">
      <div className="card__cabecera">
        <h2 className="card__titulo">{cuenta.cuenta}</h2>
        <span className={cuenta.conciliada ? 'badge badge--positivo' : 'badge badge--aviso'}>
          {textoEstadoConciliada(cuenta.conciliada)}
        </span>
      </div>
      <dl className="cuenta-conciliada__resumen">
        <div><dt>Saldo inicial</dt><dd className="num">{importe(cuenta.saldo_inicial)}</dd></div>
        <div><dt>Saldo según registros</dt><dd className="num">{importe(cuenta.saldo_teorico)}</dd></div>
        <div><dt>Saldo real (banco)</dt><dd className="num">{importe(cuenta.saldo_final)}</dd></div>
        <div>
          <dt>Diferencia</dt>
          <dd className={cuenta.conciliada ? 'num' : 'num negativo'}>{importe(cuenta.diferencia)}</dd>
        </div>
      </dl>
      {!cuenta.conciliada ? (
        <p className="aviso aviso--aviso">
          {cuenta.diferencia < 0
            ? `Faltan ${importe(Math.abs(cuenta.diferencia))} por registrar para cuadrar.`
            : `Sobran ${importe(cuenta.diferencia)} respecto al banco.`}
        </p>
      ) : null}
      <details className="cuenta-conciliada__movimientos" open>
        <summary>Movimientos ({cuenta.movimientos.length})</summary>
        <MovimientoLista movimientos={cuenta.movimientos} />
      </details>
      {formulario ? (
        <MovimientoFormulario cuenta={cuenta.cuenta} onSubmit={onAgregarMovimiento} guardando={guardando}
          error={errorAgregar} onCancel={() => setFormulario(false)} />
      ) : (
        <button type="button" className="btn btn--sm cuenta-conciliada__nuevo" onClick={() => setFormulario(true)}>
          Registrar movimiento
        </button>
      )}
    </article>
  );
}
