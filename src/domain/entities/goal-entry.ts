// REQ-27-03/04 + REQ-23-11: espejo TS de GoalEntry del backend y su
// validación COINCIDENTE (título no vacío ≤100, descripción ≤5000,
// tags ≤5×≤20, trim como en Rust). Puro: sin frameworks ni IPC.
/** Entrada del journal de metas tal cual cruza el IPC. */
export interface GoalEntry {
  readonly id: string;
  readonly titulo: string;
  readonly descripcion: string;
  readonly tags: readonly string[];
  readonly creado_en: string;
}

/** Límites idénticos a src-tauri/src/domain/onboarding/goal_entry.rs. */
export const LIMITES_META = {
  titulo: 100,
  descripcion: 5000,
  etiquetas: 5,
  etiqueta: 20,
} as const;

/** Campos validables de una meta. */
export type CampoMeta = 'titulo' | 'descripcion' | 'tags';

/** Aviso de validación ligado a un campo, en español. */
export interface AvisoCampoMeta {
  readonly campo: CampoMeta;
  readonly mensaje: string;
}

/** Datos de una meta según los escribe el usuario (sin id ni fecha). */
export interface EntradaMeta {
  readonly titulo: string;
  readonly descripcion: string;
  readonly tags: readonly string[];
}

/**
 * Valida una entrada con las MISMAS reglas que GoalEntry::nueva:
 * recorta espacios y comprueba vacío/longitud en el mismo orden.
 */
export function validarMeta(entrada: EntradaMeta): readonly AvisoCampoMeta[] {
  const avisos: AvisoCampoMeta[] = [];
  const titulo = entrada.titulo.trim();
  if (titulo.length === 0) {
    avisos.push({ campo: 'titulo', mensaje: 'el título es obligatorio' });
  } else if (titulo.length > LIMITES_META.titulo) {
    avisos.push({
      campo: 'titulo',
      mensaje: `el título no puede superar los ${LIMITES_META.titulo} caracteres`,
    });
  }
  if (entrada.descripcion.length > LIMITES_META.descripcion) {
    avisos.push({
      campo: 'descripcion',
      mensaje: `la descripción no puede superar los ${LIMITES_META.descripcion} caracteres`,
    });
  }
  if (entrada.tags.length > LIMITES_META.etiquetas) {
    avisos.push({
      campo: 'tags',
      mensaje: `no puedes añadir más de ${LIMITES_META.etiquetas} etiquetas`,
    });
    return avisos;
  }
  for (const tag of entrada.tags) {
    const limpio = tag.trim();
    if (limpio.length === 0) {
      avisos.push({ campo: 'tags', mensaje: 'las etiquetas no pueden estar vacías' });
      break;
    }
    if (limpio.length > LIMITES_META.etiqueta) {
      avisos.push({
        campo: 'tags',
        mensaje: `ninguna etiqueta puede superar los ${LIMITES_META.etiqueta} caracteres`,
      });
      break;
    }
  }
  return avisos;
}
