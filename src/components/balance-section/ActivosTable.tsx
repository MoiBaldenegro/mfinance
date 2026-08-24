// REQ-08-01: tabla editable de Activos con CRUD y validación inline.
import { useState } from 'react';
import type { Asset } from '../../domain/entities/asset.ts';
import type { CategoriaActivo } from '../../domain/entities/asset.ts';
import { CATEGORIA_ACTIVO_LABELS } from '../../domain/use-cases/balance-tabla.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { ActivoForm } from './ActivoForm.tsx';
import '../../styles/activos-table.css';

interface Props {
  readonly activos: readonly Asset[];
  readonly onUpsert: (nombre: string, categoria: CategoriaActivo, valorActual: number) => Promise<void>;
  readonly onEliminar: (nombre: string) => Promise<void>;
  readonly ocupando: boolean;
}

type ModoEdicion = { tipo: 'crear' } | { tipo: 'editar'; nombreOriginal: string };

export function ActivosTable({ activos, onUpsert, onEliminar, ocupando }: Props) {
  const [modo, setModo] = useState<ModoEdicion | null>(null);
  const moneda = usarMoneda();
  const abrirCrear = () => setModo({ tipo: 'crear' });
  const abrirEditar = (a: Asset) => setModo({ tipo: 'editar', nombreOriginal: a.nombre });
  const cancelar = () => setModo(null);
  const manejarSubmit = async (n: string, c: CategoriaActivo, v: number) => {
    try { await onUpsert(n, c, v); cancelar(); } catch {}
  };
  const manejarEliminar = async (n: string) => {
    if (!window.confirm(`¿Eliminar el activo "${n}"?`)) return;
    try { await onEliminar(n); } catch {}
  };
  const formData = modo
    ? (modo.tipo === 'crear'
      ? { nombre: '', categoria: 'liquido' as CategoriaActivo, valorActual: '' }
      : { nombre: modo.nombreOriginal, categoria: activos.find(a => a.nombre === modo.nombreOriginal)?.categoria ?? 'liquido', valorActual: activos.find(a => a.nombre === modo.nombreOriginal)?.valor_actual.toString() ?? '' })
    : { nombre: '', categoria: 'liquido' as CategoriaActivo, valorActual: '' };

  return (
    <div className="balance-tabla-wrapper">
      <div className="balance-tabla-header">
        <h3 className="balance-tabla-titulo">Activos</h3>
        <button className="btn btn--primario btn--pequeno" onClick={abrirCrear} disabled={ocupando || modo !== null}>+ Añadir activo</button>
      </div>
      {modo ? (
        <ActivoForm modo={modo} initialData={formData} onSubmit={manejarSubmit} onCancel={cancelar} ocupando={ocupando} />
      ) : (
        <table className="balance-tabla">
          <thead><tr><th>Nombre</th><th>Categoría</th><th className="balance-tabla--numero">Valor actual</th><th/></tr></thead>
          <tbody>
            {activos.length === 0 ? (
              <tr><td colSpan={4} className="balance-tabla--vacio">Sin activos. Pulsa «+ Añadir activo» para crear el primero.</td></tr>
            ) : (
              activos.map(a => (
                <tr key={a.nombre}>
                  <td>{a.nombre}</td>
                  <td><span className={`balance-categoria balance-categoria--${a.categoria}`}>{CATEGORIA_ACTIVO_LABELS[a.categoria]}</span></td>
                  <td className="balance-tabla--numero balance-tabla--positivo">{formatoMoneda(a.valor_actual, moneda)}</td>
                  <td><div className="balance-tabla__acciones">
                    <button className="btn btn--icono" onClick={() => abrirEditar(a)} disabled={ocupando} aria-label={`Editar ${a.nombre}`}>✏️</button>
                    <button className="btn btn--icono btn--peligro" onClick={() => manejarEliminar(a.nombre)} disabled={ocupando} aria-label={`Eliminar ${a.nombre}`}>🗑️</button>
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