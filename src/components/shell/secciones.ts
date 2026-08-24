// Array declarativo de navegación del shell (REQ-05-04): las diez
// secciones del producto en el orden exacto del requerimiento. Dato puro,
// sin React; el shell deriva de aquí pestañas y placeholders.
export interface Seccion {
  /** Identificador estable en kebab-case (rutas, tests, resúmenes). */
  readonly id: string;
  /** Rótulo visible en español. */
  readonly titulo: string;
}

/** Mapa mental del producto: Registro PyG Balance Deuda Inversiones Indicadores Conciliación Cierre Diagnóstico Ajustes. */
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

/** Primer identificador válido o el propio id si es desconocido. */
export function primeraSeccion(): string {
  return SECCIONES[0].id;
}

/** ¿El id pertenece al catálogo de secciones? */
export function esSeccionValida(id: string): boolean {
  return SECCIONES.some((seccion) => seccion.id === id);
}
