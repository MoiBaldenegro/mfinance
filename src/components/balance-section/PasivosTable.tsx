// Tarjeta de pasivos: tabla con edición/eliminación y alta en línea.
import { useState } from 'react';
import type { Liability } from '../../domain/entities/liability.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { formatoPorcentaje } from '../../domain/use-cases/formato-porcentaje.ts';
import { PasivoForm } from './PasivoForm.tsx';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/balance-tablas.css';

interface Props {
  readonly pasivos: readonly Liability[];
  readonly onUpsert: (nombre: string, saldo: number, tasa: number) => Promise<boolean>;
  readonly onEliminar: (nombre: string) => Promise<boolean>;
  readonly ocupando: boolean;
}

export function PasivosTable({ pasivos, onUpsert, onEliminar, ocupando }: Props) {
  const [editando, setEditando] = useState<Liability | 'nuevo' | null>(null);
  const moneda = usarMoneda();
  const guardar = async (n: string, s: number, t: number) => {
    if (await onUpsert(n, s, t)) setEditando(null);
  };
  const eliminar = (n: string) => {
    if (window.confirm(`¿Eliminar el pasivo «${n}»?`)) void onEliminar(n);
  };
  return (
    <section className="card balance-tabla" aria-label="Pasivos">
      <div className="card__cabecera">
        <h2 className="card__titulo">Pasivos</h2>
        <button type="button" className="btn btn--sm" onClick={() => setEditando('nuevo')}
          disabled={ocupando || editando !== null}>Añadir pasivo</button>
      </div>
      {editando ? (
        <PasivoForm key={editando === 'nuevo' ? 'nuevo' : editando.nombre}
          inicial={editando === 'nuevo' ? null : editando} ocupando={ocupando}
          onSubmit={guardar} onCancel={() => setEditando(null)} />
      ) : null}
      {pasivos.length === 0 ? (
        <p className="estado-vacio">Sin pasivos registrados: tarjetas, préstamos o hipotecas.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th><th className="num">Saldo</th><th className="num">Tasa anual</th>
                <th><span className="solo-lectores">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {pasivos.map((p) => (
                <tr key={p.nombre}>
                  <td>{p.nombre}</td>
                  <td className="num">{formatoMoneda(p.saldo_pendiente, moneda)}</td>
                  <td className="num">{formatoPorcentaje(p.tasa_interes_anual, moneda, 2)}</td>
                  <td className="balance-tabla__acciones">
                    <button type="button" className="btn btn--fantasma btn--sm btn--icono" title="Editar" onClick={() => setEditando(p)}
                      disabled={ocupando || editando !== null} aria-label={`Editar ${p.nombre}`}><Icono nombre="editar" tamano={16} /></button>
                    <button type="button" className="btn btn--fantasma btn--sm btn--icono balance-tabla__eliminar" title="Eliminar" onClick={() => eliminar(p.nombre)}
                      disabled={ocupando} aria-label={`Eliminar ${p.nombre}`}><Icono nombre="eliminar" tamano={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
