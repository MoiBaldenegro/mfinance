// REQ-27-04: formulario de alta/edición de una meta del journal.
// Contadores de caracteres visibles y mensajes en español junto al
// campo; la validación es validarMeta (coincidente con el backend).
import { useState } from 'react';
import type { EntradaMeta, GoalEntry } from '../../domain/entities/goal-entry.ts';
import { LIMITES_META } from '../../domain/entities/goal-entry.ts';
import '../../styles/meta-formulario.css';

interface Props {
  readonly inicial?: GoalEntry;
  readonly ocupado: boolean;
  readonly modoEdicion: boolean;
  readonly onGuardar: (entrada: EntradaMeta) => Promise<void>;
  readonly onCancelar: () => void;
  readonly errorTitulo?: string | null;
  readonly errorDescripcion?: string | null;
  readonly errorTags?: string | null;
  readonly avisoGeneral?: string | null;
}

/** Alta y edición en línea del journal (título req ≤100, desc ≤5000). */
export function FormularioMeta({
  inicial, ocupado, modoEdicion, onGuardar, onCancelar,
  errorTitulo, errorDescripcion, errorTags, avisoGeneral,
}: Props) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [tagsTexto, setTagsTexto] = useState((inicial?.tags ?? []).join(', '));
  const tags = tagsTexto.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  const tituloVacio = titulo.trim().length === 0;
  const valido = !tituloVacio && descripcion.length <= LIMITES_META.descripcion && tags.length <= LIMITES_META.etiquetas;

  const guardar = async () => {
    if (!valido || ocupado) return;
    await onGuardar({ titulo: titulo.trim(), descripcion, tags });
    setTitulo(''); setDescripcion(''); setTagsTexto('');
  };

  return (
    <div className="metas-journal__formulario">
      <label className="metas-journal__etiqueta">
        Título <span className="metas-journal__requerido">*</span>
        <input className="metas-journal__input" value={titulo} maxLength={LIMITES_META.titulo}
          placeholder="Comprar casa en 5 años" disabled={ocupado}
          aria-label="Título de la meta"
          onChange={(e) => setTitulo(e.target.value)} />
      </label>
      <span className="metas-journal__contador">{titulo.length}/{LIMITES_META.titulo}</span>
      {(errorTitulo ?? (tituloVacio ? 'el título es obligatorio' : null)) !== null && (
        <p className="metas-journal__error" role="alert">{errorTitulo ?? 'el título es obligatorio'}</p>
      )}

      <label className="metas-journal__etiqueta">
        Descripción
        <textarea className="metas-journal__textarea" value={descripcion}
          maxLength={LIMITES_META.descripcion} rows={4} disabled={ocupado}
          placeholder="Describe tu objetivo en tus palabras…"
          aria-label="Descripción de la meta"
          onChange={(e) => setDescripcion(e.target.value)} />
      </label>
      <span className="metas-journal__contador">{descripcion.length}/{LIMITES_META.descripcion}</span>
      {errorDescripcion && <p className="metas-journal__error" role="alert">{errorDescripcion}</p>}

      <label className="metas-journal__etiqueta">
        Etiquetas (separadas por coma, máx. {LIMITES_META.etiquetas})
        <input className="metas-journal__input" value={tagsTexto}
          placeholder="casa, ahorro" disabled={ocupado}
          aria-label="Etiquetas de la meta separadas por coma"
          onChange={(e) => setTagsTexto(e.target.value)} />
      </label>
      {errorTags && <p className="metas-journal__error" role="alert">{errorTags}</p>}
      {avisoGeneral && <p className="metas-journal__error" role="alert">{avisoGeneral}</p>}

      <div className="metas-journal__acciones">
        <button type="button" className="metas-journal__anadir" disabled={!valido || ocupado} onClick={() => void guardar()}>
          {modoEdicion ? 'Guardar cambios' : 'Añadir meta'}
        </button>
        {modoEdicion && (
          <button type="button" className="metas-journal__accion" onClick={onCancelar} disabled={ocupado}>
            Cancelar edición
          </button>
        )}
      </div>
    </div>
  );
}
