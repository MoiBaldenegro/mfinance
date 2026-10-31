// Tarjeta de activos: tabla con edición/eliminación y alta en línea.
import { useState } from 'react';
import type { Asset, CategoriaActivo } from '../../domain/entities/asset.ts';
import { CATEGORIA_ACTIVO_LABELS } from '../../domain/use-cases/balance-tabla.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { ActivoForm } from './ActivoForm.tsx';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/balance-tablas.css';

interface Props {
  readonly activos: readonly Asset[];
  readonly onUpsert: (nombre: string, categoria: CategoriaActivo, valorActual: number) => Promise<boolean>;
  readonly onEliminar: (nombre: string) => Promise<boolean>;
  readonly ocupando: boolean;
}

export function ActivosTable({ activos, onUpsert, onEliminar, ocupando }: Props) {
  const [editando, setEditando] = useState<Asset | 'nuevo' | null>(null);
  const moneda = usarMoneda();
  const guardar = async (n: string, c: CategoriaActivo, v: number) => {
    if (await onUpsert(n, c, v)) setEditando(null);
  };
  const eliminar = (n: string) => {
    if (window.confirm(`¿Eliminar el activo «${n}»?`)) void onEliminar(n);
  };
  return (
    <section className="card balance-tabla" aria-label="Activos">
      <div className="card__cabecera">
        <h2 className="card__titulo">Activos</h2>
        <button type="button" className="btn btn--sm" onClick={() => setEditando('nuevo')}
          disabled={ocupando || editando !== null}>Añadir activo</button>
      </div>
      {editando ? (
        <ActivoForm key={editando === 'nuevo' ? 'nuevo' : editando.nombre}
          inicial={editando === 'nuevo' ? null : editando} ocupando={ocupando}
          onSubmit={guardar} onCancel={() => setEditando(null)} />
      ) : null}
      {activos.length === 0 ? (
        <p className="estado-vacio">Aún no tienes activos: cuentas, inversiones o propiedades.</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th><th>Categoría</th><th className="num">Valor</th>
                <th><span className="solo-lectores">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {activos.map((a) => (
                <tr key={a.nombre}>
                  <td>{a.nombre}</td>
                  <td><span className="badge">{CATEGORIA_ACTIVO_LABELS[a.categoria]}</span></td>
                  <td className="num">{formatoMoneda(a.valor_actual, moneda)}</td>
                  <td className="balance-tabla__acciones">
                    <button type="button" className="btn btn--fantasma btn--sm btn--icono" title="Editar" onClick={() => setEditando(a)}
                      disabled={ocupando || editando !== null} aria-label={`Editar ${a.nombre}`}><Icono nombre="editar" tamano={16} /></button>
                    <button type="button" className="btn btn--fantasma btn--sm btn--icono balance-tabla__eliminar" title="Eliminar" onClick={() => eliminar(a.nombre)}
                      disabled={ocupando} aria-label={`Eliminar ${a.nombre}`}><Icono nombre="eliminar" tamano={16} /></button>
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
