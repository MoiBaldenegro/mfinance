// Puerto del núcleo frontend para el diagnóstico PDF (REQ-12-08/09):
// lo implementa el adapter IPC bajo src/adapters/ (única llamada IPC de
// la app) y lo consumen los hooks de la sección Diagnóstico.
import type {
  ComprobanteSubida,
  MovimientoAceptadoDto,
  ResultadoLote,
} from '../entities/diagnostico.ts';
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';

export interface DiagnosticoPort {
  /** REQ-12-04/05: sube PDFs y los asocia al mes seleccionado. */
  subirComprobantes(
    mes: string,
    archivos: readonly ComprobanteSubida[],
  ): Promise<readonly string[]>;
  /** REQ-12-06/13..16: analiza los PDFs del mes y devuelve el informe. */
  diagnosticar(mes: string): Promise<ResultadoLote>;
  /** REQ-12-10..12: incorpora los movimientos confirmados al mes. */
  confirmar(
    mes: string,
    aceptados: readonly MovimientoAceptadoDto[],
  ): Promise<FinanceSnapshot>;
}
