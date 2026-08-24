// Espejo de src-tauri/src/domain/comprobante_pdf.rs (feature 12): informe
// del análisis PDF tal cual llega serializado por los commands IPC. Los
// enums unit llegan con el NOMBRE de la variante Rust (hallazgo Serde).
import type { ExpenseCategory } from './catalogs.ts';

/** Movimiento detectado en un extracto (fecha YYYY-MM-DD, €; - = cargo). */
export interface MovimientoDetectado {
  readonly fecha: string;
  readonly comercio: string;
  readonly importe: number;
}

/** Estado final de un archivo dentro del lote analizado. */
export type EstadoArchivo = 'Analizado' | 'Ilegible' | 'Corrupto' | 'Fallido';

/** Golden rule informativa por archivo (nunca bloquea la revisión). */
export type Coherencia = 'Verificada' | 'Discrepancia' | 'NoVerificable';

/** Informe de un archivo del lote con mensaje en español citándolo. */
export interface ResultadoArchivoPdf {
  readonly archivo: string;
  readonly estado: EstadoArchivo;
  readonly mensaje: string;
  readonly movimientos: readonly MovimientoDetectado[];
  readonly coherencia: Coherencia | null;
}

/** Resultado del análisis completo del mes seleccionado. */
export interface ResultadoLote {
  readonly mes: string;
  readonly archivos: readonly ResultadoArchivoPdf[];
}

/** Movimiento aceptado en la tabla revisable, listo para el backend. */
export interface MovimientoAceptadoDto {
  readonly movimiento: MovimientoDetectado;
  readonly categoria: ExpenseCategory;
}

/** Archivo subido desde el frontend: nombre original + bytes base64. */
export interface ComprobanteSubida {
  readonly nombre: string;
  readonly contenidoBase64: string;
}
