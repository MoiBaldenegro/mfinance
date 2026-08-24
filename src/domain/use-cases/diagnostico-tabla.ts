// REQ-12-10/11: estado puro de la tabla revisable del diagnóstico.
// Confirmar/editar/descartar fila a fila, con categoría obligatoria del
// catálogo cerrado antes de confirmar. Sin React ni IPC: node:test.
import type {
  ResultadoLote,
} from '../entities/diagnostico.ts';
import type { ExpenseCategory } from '../entities/catalogs.ts';

export type EstadoFila = 'pendiente' | 'confirmada' | 'descartada';

export interface FilaTabla {
  readonly id: string;
  readonly archivo: string;
  readonly fecha: string;
  readonly comercio: string;
  readonly importe: number;
  readonly categoria: ExpenseCategory | null;
  readonly estado: EstadoFila;
}

export interface CambiosFila {
  readonly fecha?: string;
  readonly comercio?: string;
  readonly importe?: number;
  readonly categoria?: ExpenseCategory | null;
}

/** Crea las filas pendientes de revisión a partir del informe del lote. */
export function crearFilas(informe: ResultadoLote): readonly FilaTabla[] {
  return informe.archivos.flatMap((archivo) =>
    archivo.movimientos.map((movimiento, indice) => ({
      id: `${archivo.archivo}#${indice}`,
      archivo: archivo.archivo,
      fecha: movimiento.fecha,
      comercio: movimiento.comercio,
      importe: movimiento.importe,
      categoria: null,
      estado: 'pendiente' as const,
    })),
  );
}

/** Valida los cambios de una fila; devuelve mensajes en español. */
export function validarCambios(cambios: CambiosFila): readonly string[] {
  const errores: string[] = [];
  if (cambios.fecha !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(cambios.fecha)) {
    errores.push('la fecha debe tener formato AAAA-MM-DD');
  }
  if (
    cambios.importe !== undefined &&
    (typeof cambios.importe !== 'number' ||
      !Number.isFinite(cambios.importe))
  ) {
    errores.push('el importe debe ser un número válido');
  }
  if (cambios.comercio !== undefined && cambios.comercio.trim() === '') {
    errores.push('el concepto no puede quedar vacío');
  }
  return errores;
}
