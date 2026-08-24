// Hook de la sección Diagnóstico (feature 12): orquesta subida, análisis
// y confirmación a través del puerto DiagnosticoPort; los .tsx solo
// renderizan. Estados de carga y error con patrón común (REQ-18-04).
import { useCallback, useState } from 'react';
import type {
  ComprobanteSubida,
  ResultadoLote,
} from '../../domain/entities/diagnostico.ts';
import type { CambiosFila, FilaTabla } from '../../domain/use-cases/diagnostico-tabla.ts';
import { crearFilas } from '../../domain/use-cases/diagnostico-tabla.ts';
import {
  aceptadosDeFilas,
  resumenFilas,
} from '../../domain/use-cases/diagnostico-tabla-acciones.ts';
import {
  confirmarFila as confirmarFilaCaso,
  descartarFila as descartarFilaCaso,
  editarFila as editarFilaCaso,
  reabrirFila as reabrirFilaCaso,
} from '../../domain/use-cases/diagnostico-tabla-acciones.ts';
import { diagnosticoPort } from '../../adapters/diagnostico-ipc-adapter.ts';
import { archivoABase64 } from '../../lib/base64.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';

/** Hook principal: mes, selección de archivos, informe y filas. */
export function useDiagnostico(mes: string) {
  const { aplicarSnapshot } = useSnapshot();
  const [seleccionados, setSeleccionados] = useState<readonly ComprobanteSubida[]>([]);
  const [preparando, setPreparando] = useState(false);
  const [analizando, setAnalizando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [informe, setInforme] = useState<ResultadoLote | null>(null);
  const [filas, setFilas] = useState<readonly FilaTabla[]>([]);

  const alElegirArchivos = useCallback(async (archivos: FileList | null) => {
    if (!archivos || archivos.length === 0) return;
    setPreparando(true);
    setError(null);
    try {
      const subidas: ComprobanteSubida[] = [];
      for (const archivo of Array.from(archivos)) {
        subidas.push({
          nombre: archivo.name,
          contenidoBase64: await archivoABase64(archivo),
        });
      }
      setSeleccionados(subidas);
      await diagnosticoPort.subirComprobantes(mes, subidas);
    } catch (fallo: unknown) {
      setError(fallo instanceof Error ? fallo.message : String(fallo));
    } finally {
      setPreparando(false);
    }
  }, [mes]);

  const analizar = useCallback(async () => {
    setAnalizando(true);
    setError(null);
    try {
      const resultado = await diagnosticoPort.diagnosticar(mes);
      setInforme(resultado);
      setFilas(crearFilas(resultado));
    } catch (fallo: unknown) {
      setError(fallo instanceof Error ? fallo.message : String(fallo));
    } finally {
      setAnalizando(false);
    }
  }, [mes]);

  const confirmarSeleccion = useCallback(async () => {
    const aceptados = aceptadosDeFilas(filas);
    if (aceptados.length === 0) return;
    setConfirmando(true);
    setError(null);
    try {
      const snapshot = await diagnosticoPort.confirmar(mes, aceptados);
      aplicarSnapshot(snapshot);
      setInforme(null);
      setFilas([]);
      setSeleccionados([]);
    } catch (fallo: unknown) {
      setError(fallo instanceof Error ? fallo.message : String(fallo));
    } finally {
      setConfirmando(false);
    }
  }, [aplicarSnapshot, filas, mes]);

  return {
    seleccionados, preparando, analizando, confirmando, error, informe, filas,
    resumen: resumenFilas(filas),
    editarFila: (id: string, cambios: CambiosFila) =>
      setFilas((actual) => editarFilaCaso(actual, id, cambios)),
    confirmarFila: (id: string) => setFilas((a) => confirmarFilaCaso(a, id)),
    descartarFila: (id: string) => setFilas((a) => descartarFilaCaso(a, id)),
    reabrirFila: (id: string) => setFilas((a) => reabrirFilaCaso(a, id)),
    alElegirArchivos, analizar, confirmarSeleccion,
  };
}
