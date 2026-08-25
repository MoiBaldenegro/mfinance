import type { Perfil } from '../../domain/entities/perfil.ts';
import { SnapshotLoadError } from '../../domain/errors/snapshot-errors.ts';
import {
  ejecutarCambioPerfil,
  type ContextoAnterior,
  type ResultadoCambio,
} from '../../domain/use-cases/rollback-perfil-vista.ts';
import type { PerfilPort } from '../../domain/ports/perfil-port.ts';
import type { CargaAislada } from '../../domain/use-cases/cargar-perfil-activo.ts';

interface Guardia { current: boolean }
interface Dependencias {
  readonly port: PerfilPort;
  readonly fijarActivo: (perfil: Perfil) => void;
  readonly recargar: () => void;
  readonly cargarSnapshot: () => Promise<CargaAislada>;
  readonly esCargaVigente: (generacion: number) => boolean;
  readonly publicarSnapshot: (carga: CargaAislada, comprometer: () => void) => boolean;
  readonly generacionActual: () => number;
  readonly mostrarError: (error: SnapshotLoadError, generacion: number) => boolean;
  readonly mostrarFalloPerfil: (perfil: Perfil, error: SnapshotLoadError,
    rollback: () => Promise<ResultadoCambio>) => void;
  readonly registrarReintento: (accion: () => void | Promise<void>) => void;
  readonly restaurarSeccion: (seccion: string) => void;
  readonly contexto: ContextoAnterior;
  readonly guardia: Guardia;
  readonly cambiar: (estado: boolean) => void;
  readonly avisar: (mensaje: string | null) => void;
}
type FalloPendiente = Extract<ResultadoCambio, { readonly fase: 'snapshot-nuevo-pendiente' }>;
const esFalloPendiente = (resultado: ResultadoCambio): resultado is FalloPendiente =>
  !resultado.ok && resultado.fase === 'snapshot-nuevo-pendiente' && 'rollback' in resultado;

export async function activarPerfil(id: string, deps: Dependencias): Promise<void> {
  if (deps.guardia.current) return;
  deps.guardia.current = true;
  deps.cambiar(true);
  deps.avisar(null);
  try {
    const resultado = await ejecutarCambioPerfil({
      perfilPort: deps.port,
      cargarSnapshot: deps.cargarSnapshot,
      esCargaVigente: deps.esCargaVigente,
      publicarSnapshot: deps.publicarSnapshot,
      generacionActual: deps.generacionActual,
      contexto: deps.contexto,
      objetivoId: id,
      alIniciar: () => {},
      alFase: () => {},
      alConfirmar: deps.fijarActivo,
      alRestaurarVista: deps.restaurarSeccion,
      alFinalizar: () => deps.registrarReintento(deps.recargar),
      alError: (fase, error, generacion, reintentar) => {
        deps.registrarReintento(async () => { await reintentar(); });
        deps.mostrarError(new SnapshotLoadError(`${fase}: ${error.message}`), generacion);
      },
      alCancelar: () => {},
    });
    if (esFalloPendiente(resultado)) {
      const error = resultado.error instanceof SnapshotLoadError
        ? resultado.error : new SnapshotLoadError(resultado.error.message);
      deps.mostrarFalloPerfil(resultado.perfil, error, resultado.rollback);
    }
    if (!resultado.ok && resultado.fase === 'seleccion') deps.avisar(resultado.error.message);
  } finally {
    deps.guardia.current = false;
    deps.cambiar(false);
  }
}

// El flujo anterior usaba alConfirmar: deps.fijarActivo y alRecargar: deps.recargar.
export type { ResultadoCambio };
