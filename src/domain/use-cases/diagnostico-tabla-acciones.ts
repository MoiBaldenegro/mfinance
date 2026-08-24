// Parte 2 de diagnostico-tabla: acciones fila a fila (confirmar,
// descartar, reabrir) y mapeo a DTO de confirmación. El resumen del
// informe vive en diagnostico-informe-resumen.ts.
import type { MovimientoAceptadoDto } from '../entities/diagnostico.ts';
import type {
  CambiosFila,
  EstadoFila,
  FilaTabla,
} from './diagnostico-tabla.ts';

/** Devuelve las filas con los cambios aplicados (inmutabilidad). */
export function editarFila(
  filas: readonly FilaTabla[],
  id: string,
  cambios: CambiosFila,
): readonly FilaTabla[] {
  return filas.map((fila) =>
    fila.id === id ? { ...fila, ...cambios } : fila,
  );
}

/** Confirma una fila; exige categoría del catálogo cerrado (REQ-12-11). */
export function confirmarFila(
  filas: readonly FilaTabla[],
  id: string,
): readonly FilaTabla[] {
  return filas.map((fila) => {
    if (fila.id !== id || fila.estado !== 'pendiente') return fila;
    if (fila.categoria === null) return fila;
    return { ...fila, estado: 'confirmada' as const };
  });
}

/** Descarta una fila pendiente: no se incorporará al mes. */
export function descartarFila(
  filas: readonly FilaTabla[],
  id: string,
): readonly FilaTabla[] {
  return cambiarEstado(filas, id, 'pendiente', 'descartada');
}

/** Reabre una fila ya decidida para volver a editarla. */
export function reabrirFila(
  filas: readonly FilaTabla[],
  id: string,
): readonly FilaTabla[] {
  return cambiarEstado(filas, id, undefined, 'pendiente');
}

function cambiarEstado(
  filas: readonly FilaTabla[],
  id: string,
  desde: EstadoFila | undefined,
  hacia: EstadoFila,
): readonly FilaTabla[] {
  return filas.map((fila) =>
    fila.id === id && (desde === undefined || fila.estado === desde)
      ? { ...fila, estado: hacia }
      : fila,
  );
}

/** Conteo por estado para la barra de resumen de la tabla. */
export function resumenFilas(filas: readonly FilaTabla[]) {
  const por = (estado: EstadoFila) =>
    filas.filter((fila) => fila.estado === estado).length;
  return {
    pendientes: por('pendiente'),
    confirmadas: por('confirmada'),
    descartadas: por('descartada'),
    total: filas.length,
  };
}

/** Movimientos listos para el backend: solo las filas confirmadas. */
export function aceptadosDeFilas(
  filas: readonly FilaTabla[],
): readonly MovimientoAceptadoDto[] {
  return filas
    .filter((fila) => fila.estado === 'confirmada' && fila.categoria !== null)
    .map((fila) => ({
      movimiento: {
        fecha: fila.fecha,
        comercio: fila.comercio,
        importe: fila.importe,
      },
      categoria: fila.categoria as NonNullable<FilaTabla['categoria']>,
    }));
}

