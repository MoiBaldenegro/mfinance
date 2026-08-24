// REQ-17-04: resolución PURA del tema activo. Sin preferencia almacenada
// o con valor corrupto devuelve el oscuro (default de la app); solo los
// valores exactos 'claro' y 'oscuro' se respetan (REQ-17-03). Módulo sin
// DOM ni storage: testeable con node:test aislado.
import type { Tema } from '../entities/tema.ts';

/** Resuelve el tema activo desde la preferencia cruda leída del puerto. */
export function resolverTema(preferencia: string | null | undefined): Tema {
  if (preferencia === 'claro') return 'claro';
  return 'oscuro';
}

/** Siguiente tema para el conmutador de Ajustes (REQ-17-02). */
export function alternarTema(tema: Tema): Tema {
  return tema === 'oscuro' ? 'claro' : 'oscuro';
}
