// REQ-27-03/04/10: sección «Mis metas (Journal)». CRUD completo de
// entradas con la MISMA validación que el backend (validarMeta). Se
// reutiliza tal cual en el paso 4 del wizard y en Ajustes («Mis metas»).
import { useEffect, useState } from 'react';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import { useMetas } from '../../hooks/use-metas.ts';
import { FormularioMeta } from './FormularioMeta.tsx';
import '../../styles/metas-journal.css';

interface Props {
  readonly perfilId?: string;
  readonly metasIniciales?: readonly GoalEntry[];
  /** Notifica al padre cada cambio del journal (para el resumen). */
  readonly alCambiar?: (metas: readonly GoalEntry[]) => void;
  readonly deshabilitado?: boolean;
}

/** Journal de metas: lista + formulario alta/edición con contador. */
export function MetasJournalSection({ perfilId, metasIniciales = [], alCambiar, deshabilitado = false }: Props) {
  const { metas, ocupado, aviso, avisos, agregar, guardar, eliminar } = useMetas(perfilId, metasIniciales);
  useEffect(() => { alCambiar?.(metas); }, [metas]); // eslint-disable-line react-hooks/exhaustive-deps
  const [editandoId, setEditandoId] = useState<string | null>(null);
  return (
    <fieldset className="metas-journal" disabled={deshabilitado || ocupado}>
      <legend className="metas-journal__titulo">Mis metas (Journal)</legend>
      <p className="metas-journal__ayuda">
        Escribe tus objetivos financieros en tus propias palabras. Sin formato rígido.
      </p>
      <FormularioMeta
        inicial={metas.find((m) => m.id === editandoId)}
        ocupado={ocupado}
        onCancelar={() => setEditandoId(null)}
        onGuardar={async (entrada) => {
          const ok = editandoId ? await guardar(editandoId, entrada) : await agregar(entrada);
          if (ok) setEditandoId(null);
        }}
        modoEdicion={editandoId !== null}
        errorTitulo={textoDe(avisos, 'titulo')}
        errorDescripcion={textoDe(avisos, 'descripcion')}
        errorTags={textoDe(avisos, 'tags')}
        avisoGeneral={aviso}
      />
      <ListaMetas metas={metas} alEditar={setEditandoId} alEliminar={(id) => void eliminar(id)} />
    </fieldset>
  );
}

function textoDe(avisos: readonly { campo: string; mensaje: string }[], campo: string): string | null {
  return avisos.find((a) => a.campo === campo)?.mensaje ?? null;
}

function ListaMetas({ metas, alEditar, alEliminar }: {
  readonly metas: readonly GoalEntry[];
  readonly alEditar: (id: string) => void;
  readonly alEliminar: (id: string) => void;
}) {
  if (metas.length === 0) return null;
  return (
    <ul className="metas-journal__lista">
      {metas.map((meta) => (
        <li key={meta.id} className="metas-journal__entrada">
          <div className="metas-journal__cabecera">
            <span className="metas-journal__titulo-meta">{meta.titulo}</span>
            <button type="button" className="metas-journal__accion" onClick={() => alEditar(meta.id)}>Editar</button>
            <button type="button" className="metas-journal__accion metas-journal__accion--peligro" aria-label={`Eliminar meta ${meta.titulo}`} onClick={() => alEliminar(meta.id)}>Eliminar</button>
          </div>
          {meta.descripcion && <p className="metas-journal__descripcion">{meta.descripcion}</p>}
          {meta.tags.length > 0 && (
            <p className="metas-journal__tags">{meta.tags.map((t) => `#${t}`).join(' ')}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
