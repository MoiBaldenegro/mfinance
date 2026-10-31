// Formulario de alta/edición de una meta del journal: contadores visibles
// y errores en español junto a cada campo. El aviso de título vacío solo
// aparece después de tocar el campo.
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
  /** Muestra «Cancelar» también en el alta (cuando hay metas a las que volver). */
  readonly cancelable?: boolean;
  readonly errorTitulo?: string | null;
  readonly errorDescripcion?: string | null;
  readonly errorTags?: string | null;
  readonly avisoGeneral?: string | null;
}

/** Alta y edición en línea del journal (título req ≤100, desc ≤5000). */
export function FormularioMeta({
  inicial, ocupado, modoEdicion, onGuardar, onCancelar, cancelable = false,
  errorTitulo, errorDescripcion, errorTags, avisoGeneral,
}: Props) {
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '');
  const [tocado, setTocado] = useState(false);
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [tagsTexto, setTagsTexto] = useState((inicial?.tags ?? []).join(', '));
  const tags = tagsTexto.split(',').map((t) => t.trim()).filter((t) => t.length > 0);
  const tituloVacio = titulo.trim().length === 0;
  const valido = !tituloVacio && descripcion.length <= LIMITES_META.descripcion && tags.length <= LIMITES_META.etiquetas;
  const avisoTitulo = errorTitulo ?? (tocado && tituloVacio ? 'El título es obligatorio.' : null);

  const guardar = async () => {
    if (!valido || ocupado) return;
    await onGuardar({ titulo: titulo.trim(), descripcion, tags });
    setTitulo(''); setDescripcion(''); setTagsTexto(''); setTocado(false);
  };

  return (
    <div className="meta-formulario">
      <label className="campo">
        <span className="campo__etiqueta">Título</span>
        <input value={titulo} maxLength={LIMITES_META.titulo} placeholder="Comprar casa en 5 años"
          disabled={ocupado} aria-label="Título de la meta" aria-invalid={avisoTitulo ? true : undefined}
          onBlur={() => setTocado(true)} onChange={(e) => setTitulo(e.target.value)} />
        <span className="meta-formulario__pie">
          {avisoTitulo ? <span className="campo__error" role="alert">{avisoTitulo}</span> : <span />}
          <span className="campo__ayuda">{titulo.length}/{LIMITES_META.titulo}</span>
        </span>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Descripción</span>
        <textarea value={descripcion} maxLength={LIMITES_META.descripcion} rows={3} disabled={ocupado}
          placeholder="Describe tu objetivo con tus palabras…" aria-label="Descripción de la meta"
          onChange={(e) => setDescripcion(e.target.value)} />
        <span className="meta-formulario__pie">
          {errorDescripcion ? <span className="campo__error" role="alert">{errorDescripcion}</span> : <span />}
          <span className="campo__ayuda">{descripcion.length}/{LIMITES_META.descripcion}</span>
        </span>
      </label>

      <label className="campo">
        <span className="campo__etiqueta">Etiquetas</span>
        <input value={tagsTexto} placeholder="casa, ahorro" disabled={ocupado}
          aria-label="Etiquetas de la meta separadas por coma"
          onChange={(e) => setTagsTexto(e.target.value)} />
        <span className="campo__ayuda">Separadas por coma, máximo {LIMITES_META.etiquetas}.</span>
        {errorTags ? <span className="campo__error" role="alert">{errorTags}</span> : null}
      </label>
      {avisoGeneral ? <p className="aviso aviso--error" role="alert">{avisoGeneral}</p> : null}

      <div className="meta-formulario__acciones">
        {modoEdicion || cancelable ? (
          <button type="button" className="btn btn--fantasma" onClick={onCancelar} disabled={ocupado}>
            {modoEdicion ? 'Cancelar edición' : 'Cancelar'}
          </button>
        ) : null}
        <button type="button" className="btn btn--primario" disabled={!valido || ocupado} onClick={() => void guardar()}>
          {modoEdicion ? 'Guardar cambios' : 'Añadir meta'}
        </button>
      </div>
    </div>
  );
}
