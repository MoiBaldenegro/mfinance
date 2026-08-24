// REQ-08-01/06: formulario de Activo (crear/editar) con validación inline.
import { useState, FormEvent } from 'react';
import '../../styles/activos-table.css';
import type { CategoriaActivo } from '../../domain/entities/asset.ts';
import { CATEGORIAS_ACTIVO_CANONICAS, CATEGORIA_ACTIVO_LABELS } from '../../domain/use-cases/balance-tabla.ts';
import { validarActivo } from '../../domain/use-cases/balance-validaciones.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';

interface Props {
  readonly modo: { tipo: 'crear' } | { tipo: 'editar'; nombreOriginal: string };
  readonly initialData: { nombre: string; categoria: CategoriaActivo; valorActual: string };
  readonly onSubmit: (nombre: string, categoria: CategoriaActivo, valorActual: number) => Promise<void>;
  readonly onCancel: () => void;
  readonly ocupando: boolean;
}

export function ActivoForm({
  modo,
  initialData,
  onSubmit,
  onCancel,
  ocupando,
}: Props) {
  const simbolo = simboloDe(usarMoneda());
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState<string | undefined>();

  const manejarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const valor = Number(form.valorActual);
    const errorVal = validarActivo(form.nombre, form.categoria, valor);
    if (errorVal) {
      setError(errorVal);
      return;
    }
    try {
      await onSubmit(form.nombre, form.categoria, valor);
      onCancel();
    } catch {
      // error manejado en hook
    }
  };

  return (
    <form className="balance-form" onSubmit={manejarSubmit}>
      <div className="balance-form__fila">
        <label className="balance-form__label">
          Nombre
          <input
            type="text"
            className="balance-form__input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            disabled={ocupando}
          />
        </label>
        <label className="balance-form__label">
          Categoría
          <select
            className="balance-form__select"
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value as CategoriaActivo })}
            disabled={ocupando}
          >
            {CATEGORIAS_ACTIVO_CANONICAS.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIA_ACTIVO_LABELS[cat]}
              </option>
            ))}
          </select>
        </label>
        <label className="balance-form__label">
          Valor actual ({simbolo})
          <input
            type="number"
            step="0.01"
            min="0"
            className="balance-form__input"
            value={form.valorActual}
            onChange={(e) => setForm({ ...form, valorActual: e.target.value })}
            required
            disabled={ocupando}
          />
        </label>
      </div>
      {error && <p className="balance-form__error" role="alert">{error}</p>}
      <div className="balance-form__acciones">
        <button type="submit" className="btn btn--primario" disabled={ocupando}>
          {modo.tipo === 'crear' ? 'Crear' : 'Guardar'}
        </button>
        <button type="button" className="btn btn--secundario" onClick={onCancel} disabled={ocupando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}