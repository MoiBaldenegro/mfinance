// Formulario de activo (alta/edición). En edición el nombre es la clave
// del upsert y no se puede cambiar (evita duplicados al «renombrar»).
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Asset, CategoriaActivo } from '../../domain/entities/asset.ts';
import { CATEGORIAS_ACTIVO_CANONICAS, CATEGORIA_ACTIVO_LABELS } from '../../domain/use-cases/balance-tabla.ts';
import { validarActivo } from '../../domain/use-cases/balance-validaciones.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/balance-tablas.css';

interface Props {
  readonly inicial: Asset | null;
  readonly onSubmit: (nombre: string, categoria: CategoriaActivo, valorActual: number) => Promise<void>;
  readonly onCancel: () => void;
  readonly ocupando: boolean;
}

export function ActivoForm({ inicial, onSubmit, onCancel, ocupando }: Props) {
  const simbolo = simboloDe(usarMoneda());
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [categoria, setCategoria] = useState<CategoriaActivo>(inicial?.categoria ?? 'liquido');
  const [valor, setValor] = useState(inicial ? String(inicial.valor_actual) : '');
  const [error, setError] = useState<string | undefined>();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const importe = Number(valor);
    const fallo = validarActivo(nombre.trim(), categoria, importe);
    setError(fallo ?? undefined);
    if (!fallo) void onSubmit(nombre.trim(), categoria, importe);
  };

  return (
    <form className="balance-form" onSubmit={enviar}
      aria-label={inicial ? `Editar ${inicial.nombre}` : 'Nuevo activo'}>
      <label className="campo">
        <span className="campo__etiqueta">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus
          disabled={ocupando || inicial !== null} placeholder="Cuenta de ahorro" />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Categoría</span>
        <select value={categoria} disabled={ocupando}
          onChange={(e) => setCategoria(e.target.value as CategoriaActivo)}>
          {CATEGORIAS_ACTIVO_CANONICAS.map((c) => <option key={c} value={c}>{CATEGORIA_ACTIVO_LABELS[c]}</option>)}
        </select>
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Valor actual ({simbolo})</span>
        <input type="number" step="0.01" min="0" value={valor} required disabled={ocupando}
          onChange={(e) => setValor(e.target.value)} />
      </label>
      {error ? <p className="campo__error balance-form__error" role="alert">{error}</p> : null}
      <div className="balance-form__acciones">
        <button type="button" className="btn btn--fantasma" onClick={onCancel} disabled={ocupando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={ocupando}>{inicial ? 'Guardar' : 'Añadir'}</button>
      </div>
    </form>
  );
}
