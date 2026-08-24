// REQ-08-02: tabla editable de Pasivos con CRUD y validación inline.
import { useState } from 'react';
import type { Liability } from '../../domain/entities/liability.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { PasivoForm } from './PasivoForm.tsx';
import '../../styles/pasivos-table.css';

interface Props {
  readonly pasivos: readonly Liability[];
  readonly onUpsert: (n: string, s: number, t: number) => Promise<void>;
  readonly onEliminar: (n: string) => Promise<void>;
  readonly ocupando: boolean;
}

type ModoEdicion = { tipo: 'crear' } | { tipo: 'editar'; nombreOriginal: string };

export function PasivosTable({ pasivos, onUpsert, onEliminar, ocupando }: Props) {
  const [modo, setModo] = useState<ModoEdicion | null>(null);
  const moneda = usarMoneda();
  const abrirCrear = () => setModo({ tipo: 'crear' });
  const abrirEditar = (p: Liability) => setModo({ tipo: 'editar', nombreOriginal: p.nombre });
  const cancelar = () => setModo(null);
  const manejarSubmit = async (n: string, s: number, t: number) => {
    try { await onUpsert(n, s, t); cancelar(); } catch {}
  };
  const manejarEliminar = async (n: string) => {
    if (!window.confirm(`¿Eliminar el pasivo "${n}"?`)) return;
    try { await onEliminar(n); } catch {}
  };
  const formData = modo
    ? (modo.tipo === 'crear'
      ? { nombre: '', saldoPendiente: '', tasaInteresAnual: '' }
      : { nombre: modo.nombreOriginal, saldoPendiente: pasivos.find(p => p.nombre === modo.nombreOriginal)?.saldo_pendiente.toString() ?? '', tasaInteresAnual: pasivos.find(p => p.nombre === modo.nombreOriginal)?.tasa_interes_anual.toString() ?? '' })
    : { nombre: '', saldoPendiente: '', tasaInteresAnual: '' };

  return (
    <div className="balance-tabla-wrapper">
      <div className="balance-tabla-header">
        <h3 className="balance-tabla-titulo">Pasivos</h3>
        <button className="btn btn--primario btn--pequeno" onClick={abrirCrear} disabled={ocupando || modo !== null}>+ Añadir pasivo</button>
      </div>
      {modo ? (
        <PasivoForm modo={modo} initialData={formData} onSubmit={manejarSubmit} onCancel={cancelar} ocupando={ocupando} />
      ) : (
        <table className="balance-tabla">
          <thead><tr><th>Nombre</th><th className="balance-tabla--numero">Saldo pendiente</th><th className="balance-tabla--numero">Tasa anual</th><th/></tr></thead>
          <tbody>
            {pasivos.length === 0 ? (
              <tr><td colSpan={4} className="balance-tabla--vacio">Sin pasivos. Pulsa «+ Añadir pasivo» para crear el primero.</td></tr>
            ) : (
              pasivos.map(p => (
                <tr key={p.nombre}>
                  <td>{p.nombre}</td>
                  <td className="balance-tabla--numero balance-tabla--negativo">{formatoMoneda(p.saldo_pendiente, moneda)}</td>
                  <td className="balance-tabla--numero">{p.tasa_interes_anual.toFixed(1).replace('.', ',')} %</td>
                  <td><div className="balance-tabla__acciones">
                    <button className="btn btn--icono" onClick={() => abrirEditar(p)} disabled={ocupando} aria-label={`Editar ${p.nombre}`}>✏️</button>
                    <button className="btn btn--icono btn--peligro" onClick={() => manejarEliminar(p.nombre)} disabled={ocupando} aria-label={`Eliminar ${p.nombre}`}>🗑️</button>
                  </div></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}