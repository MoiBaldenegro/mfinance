// Catálogo declarativo de navegación del shell: las diez secciones del
// producto y su agrupación en la barra lateral. Dato puro, sin React.
export interface Seccion {
  /** Identificador estable en minúsculas (navegación, tests, resúmenes). */
  readonly id: string;
  /** Rótulo visible en español. */
  readonly titulo: string;
}

export interface GrupoNavegacion {
  readonly titulo: string;
  readonly ids: readonly string[];
}

/** Registro PyG Balance Deuda Inversiones Indicadores Conciliación Cierre Diagnóstico Ajustes. */
export const SECCIONES: readonly Seccion[] = [
  { id: 'registro', titulo: 'Registro' },
  { id: 'pyg', titulo: 'PyG' },
  { id: 'balance', titulo: 'Balance' },
  { id: 'deuda', titulo: 'Deuda' },
  { id: 'inversiones', titulo: 'Inversiones' },
  { id: 'indicadores', titulo: 'Indicadores' },
  { id: 'conciliacion', titulo: 'Conciliación' },
  { id: 'cierre', titulo: 'Cierre' },
  { id: 'diagnostico', titulo: 'Diagnóstico' },
  { id: 'ajustes', titulo: 'Ajustes' },
];

/** Agrupación de la barra lateral; Ajustes vive aparte, al pie. */
export const GRUPOS_NAVEGACION: readonly GrupoNavegacion[] = [
  { titulo: 'Mes', ids: ['registro', 'cierre', 'conciliacion', 'diagnostico'] },
  { titulo: 'Análisis', ids: ['pyg', 'balance', 'indicadores'] },
  { titulo: 'Planes', ids: ['deuda', 'inversiones'] },
];

/** Sección por id; las desconocidas devuelven la primera. */
export function seccionPorId(id: string): Seccion {
  return SECCIONES.find((seccion) => seccion.id === id) ?? SECCIONES[0];
}

/** Primera sección del catálogo (pantalla de inicio). */
export function primeraSeccion(): string {
  return SECCIONES[0].id;
}

/** ¿El id pertenece al catálogo de secciones? */
export function esSeccionValida(id: string): boolean {
  return SECCIONES.some((seccion) => seccion.id === id);
}
