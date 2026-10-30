// REQ-27-03/04/10: sección «Mis metas (Journal)». CRUD completo de
// entradas con la MISMA validación que el backend (validarMeta). Se
// reutiliza tal cual en el paso 4 del wizard y en Ajustes («Mis metas»).
import { useEffect, useState } from 'react';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import { useMetas } from '../../hooks/use-metas.ts';
import { FormularioMeta } from './FormularioMeta.tsx';
import { Icono } from '../shell/Icono.tsx';
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
  // Alta bajo demanda: el formulario se abre solo si aún no hay metas.
  const [altaAbierta, setAltaAbierta] = useState(metasIniciales.length === 0);
  const cerrar = () => { setEditandoId(null); setAltaAbierta(false); };
  const formularioVisible = editandoId !== null || altaAbierta || metas.length === 0;
  return (
    <fieldset className="metas-journal" disabled={deshabilitado || ocupado}>
      <legend className="metas-journal__titulo">Mis metas</legend>
      <p className="metas-journal__ayuda">
        Escribe tus objetivos financieros con tus palabras. Se guardan con tu perfil.
      </p>
      <ListaMetas metas={metas} alEditar={(id) => { setEditandoId(id); setAltaAbierta(false); }} alEliminar={(id) => void eliminar(id)} />
      {formularioVisible ? <FormularioMeta
        key={editandoId ?? "nueva"}
        inicial={metas.find((m) => m.id === editandoId)}
        ocupado={ocupado}
        onCancelar={cerrar}
        cancelable={metas.length > 0}
        onGuardar={async (entrada) => {
          const ok = editandoId ? await guardar(editandoId, entrada) : await agregar(entrada);
          if (ok) cerrar();
        }}
        modoEdicion={editandoId !== null}
        errorTitulo={textoDe(avisos, 'titulo')}
        errorDescripcion={textoDe(avisos, 'descripcion')}
        errorTags={textoDe(avisos, 'tags')}
        avisoGeneral={aviso}
      /> : (
        <button type="button" className="btn btn--sm metas-journal__anadir" onClick={() => setAltaAbierta(true)}>
          <Icono nombre="mas" tamano={14} /> Añadir meta
        </button>
      )}
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
            <button type="button" className="btn btn--fantasma btn--sm btn--icono" title="Editar"
              aria-label={`Editar meta ${meta.titulo}`} onClick={() => alEditar(meta.id)}><Icono nombre="editar" tamano={16} /></button>
            <button type="button" className="btn btn--fantasma btn--sm btn--icono metas-journal__eliminar" title="Eliminar"
              aria-label={`Eliminar meta ${meta.titulo}`} onClick={() => alEliminar(meta.id)}><Icono nombre="eliminar" tamano={16} /></button>
          </div>
          {meta.descripcion && <p className="metas-journal__descripcion">{meta.descripcion}</p>}
          {meta.tags.length > 0 && (
            <p className="metas-journal__tags">{meta.tags.map((t) => <span key={t} className="badge">#{t}</span>)}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
