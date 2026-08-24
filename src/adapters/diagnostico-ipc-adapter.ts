// REQ-12-09: adapter Tauri IPC del puerto DiagnosticoPort. ÚNICO módulo
// del frontend que invoca invoke() para la feature 12, contra los
// commands subir_comprobantes_cmd / diagnosticar_comprobantes_cmd /
// confirmar_diagnostico_cmd, reconstruyendo errores nombrados.
import { invoke } from '@tauri-apps/api/core';
import type {
  ComprobanteSubida,
  MovimientoAceptadoDto,
  ResultadoLote,
} from '../domain/entities/diagnostico.ts';
import type { FinanceSnapshot } from '../domain/entities/finance-snapshot.ts';
import type { DiagnosticoPort } from '../domain/ports/diagnostico-port.ts';
import { DiagnosticoIpcError } from '../domain/errors/diagnostico-errors.ts';

async function llamar<T>(comando: string, argumentos?: Record<string, unknown>): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    const codigo = typeof error === 'object' && error !== null && 'codigo' in error
      ? String((error as { codigo: unknown }).codigo)
      : 'DiagnosticoIpcError';
    const mensaje = typeof error === 'object' && error !== null && 'mensaje' in error
      ? String((error as { mensaje: unknown }).mensaje)
      : String(error);
    throw new DiagnosticoIpcError(codigo, mensaje);
  }
}

/** Adapter del puerto de diagnóstico (lo inyecta el hook de sección). */
class DiagnosticoIpcAdapter implements DiagnosticoPort {
  subirComprobantes(
    mes: string,
    archivos: readonly ComprobanteSubida[],
  ): Promise<readonly string[]> {
    return llamar<readonly string[]>('subir_comprobantes_cmd', {
      mes,
      archivos: archivos.map((archivo) => ({
        nombre: archivo.nombre,
        contenido_base64: archivo.contenidoBase64,
      })),
    });
  }

  diagnosticar(mes: string): Promise<ResultadoLote> {
    return llamar<ResultadoLote>('diagnosticar_comprobantes_cmd', { mes });
  }

  confirmar(
    mes: string,
    aceptados: readonly MovimientoAceptadoDto[],
  ): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('confirmar_diagnostico_cmd', {
      mes,
      aceptados,
    });
  }
}

/** Instancia única del puerto para toda la app. */
export const diagnosticoPort: DiagnosticoPort = new DiagnosticoIpcAdapter();
