import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { Perfil } from '../../domain/entities/perfil.ts';
import type { OnboardingStatus } from '../../domain/entities/onboarding/index.ts';
import { SnapshotLoadError } from '../../domain/errors/snapshot-errors.ts';
import type { CargaAislada, ResultadoPerfilActivo } from '../../domain/use-cases/cargar-perfil-activo.ts';
import { crearControladorSnapshot } from '../../domain/use-cases/snapshot-provider-controller.ts';
import type { ResultadoCambio } from '../../domain/use-cases/rollback-perfil-vista.ts';
// El adapter delega en snapshotPort.obtenerPerfilActivoConOnboarding; onboarding_status.nombre === 'Completed' abre la shell.
export type EstadoSnapshot =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly snapshot: FinanceSnapshot }
  | { readonly nombre: 'error'; readonly error: SnapshotLoadError; readonly recuperar?: () => void }
  | { readonly nombre: 'fallo-perfil'; readonly perfilObjetivo: Perfil; readonly error: SnapshotLoadError;
      readonly rollback: () => Promise<ResultadoCambio> }
   | { readonly nombre: 'onboarding'; readonly snapshot: FinanceSnapshot; readonly onboardingStatus: OnboardingStatus };
interface ValorSnapshot {
  readonly estado: EstadoSnapshot;
  readonly recargar: () => void;
  readonly cargarParaCambio: () => Promise<CargaAislada>;
  readonly esCargaVigente: (generacion: number) => boolean;
  readonly generacionActual: () => number;
  readonly publicarSnapshot: (carga: CargaAislada, comprometer: () => void) => boolean;
  readonly mostrarError: (error: SnapshotLoadError, generacion: number) => boolean;
  readonly registrarReintento: (accion: () => void | Promise<void>) => void;
  readonly reintento: () => void;
  readonly aplicarSnapshot: (snapshot: FinanceSnapshot, generacion?: number) => boolean;
  readonly completarOnboarding: () => void;
  readonly mostrarFalloPerfil: (perfil: Perfil, error: SnapshotLoadError,
    rollback: () => Promise<ResultadoCambio>) => void;
  readonly confirmarRollback: () => void;
  readonly cerrarFalloPerfil: () => void;
}

export const SnapshotContext = createContext<ValorSnapshot | null>(null);
function estadoDeResultado(resultado: ResultadoPerfilActivo): EstadoSnapshot {
  if (!resultado.ok) return { nombre: 'error', error: resultado.error };
  const { snapshot, onboarding_status: status } = resultado.datos;
  return status.nombre === 'Completed'
    ? { nombre: 'listo', snapshot }
    : { nombre: 'onboarding', snapshot, onboardingStatus: status };
}

export function SnapshotProvider({ children }: { readonly children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSnapshot>({ nombre: 'cargando' });
  const rollbackEnCurso = useRef(false);
  const controlador = useRef(crearControladorSnapshot(snapshotPort, estadoDeResultado,
    (snapshot): EstadoSnapshot => ({ nombre: 'listo', snapshot }), setEstado,
    { nombre: 'cargando' as const })).current;
  const recargar = useCallback(() => { void controlador.solicitar(true); }, [controlador]);
  useEffect(() => { recargar(); }, [recargar]);
  const [reintento, setReintento] = useState<() => void>(() => recargar);
  const cargarParaCambio = useCallback(() => controlador.solicitar(false), [controlador]);
  const esCargaVigente = useCallback((actual: number) => controlador.esCargaVigente(actual), [controlador]);
  const generacionActual = useCallback(() => controlador.generacionActual(), [controlador]);
  const publicarSnapshot = useCallback((carga: CargaAislada, comprometer: () => void) =>
    controlador.publicarSnapshot(carga, comprometer), [controlador]);
  const registrarReintento = useCallback((accion: () => void | Promise<void>) => {
    setReintento(() => () => { void accion(); });
  }, []);
  const mostrarError = useCallback((error: SnapshotLoadError, actual: number) =>
    controlador.mostrarError(error, actual), [controlador]);
  const aplicarSnapshot = useCallback((snapshot: FinanceSnapshot, actual?: number) =>
    controlador.aplicarSnapshot(snapshot, actual), [controlador]);
  // completarOnboarding reemplaza setIntento((n) => n + 1) con una generación explícita.
  const completarOnboarding = useCallback(() => { void controlador.solicitar(true); }, [controlador]);
  const iniciarRollback = useCallback((rollback: () => Promise<ResultadoCambio>) => {
    if (rollbackEnCurso.current) return;
    rollbackEnCurso.current = true; setEstado({ nombre: 'cargando' });
    void rollback().catch((error: unknown) => {
      const fallo = error instanceof SnapshotLoadError ? error : new SnapshotLoadError(`rollback: ${error instanceof Error ? error.message : String(error)}`);
      setEstado({ nombre: 'error', error: fallo,
        recuperar: () => iniciarRollback(rollback) });
    }).finally(() => { rollbackEnCurso.current = false; });
  }, []);
  const mostrarFalloPerfil = useCallback((perfilObjetivo: Perfil, error: SnapshotLoadError,
    rollback: () => Promise<ResultadoCambio>) => {
    setEstado({ nombre: 'fallo-perfil', perfilObjetivo, error, rollback });
  }, []);
  const confirmarRollback = useCallback(() => {
    if (estado.nombre === 'fallo-perfil') iniciarRollback(estado.rollback);
  }, [estado, iniciarRollback]);
  const cerrarFalloPerfil = useCallback(() => {
    if (estado.nombre === 'fallo-perfil') {
      setEstado({ nombre: 'error', error: estado.error,
        recuperar: () => iniciarRollback(estado.rollback) });
    }
  }, [estado, iniciarRollback]);
  const valor = { estado, recargar, cargarParaCambio, esCargaVigente, generacionActual, publicarSnapshot, mostrarError, registrarReintento,
    aplicarSnapshot, completarOnboarding, reintento, mostrarFalloPerfil, confirmarRollback, cerrarFalloPerfil };
  return <SnapshotContext.Provider value={valor}>{children}</SnapshotContext.Provider>;
}

export function useSnapshot(): ValorSnapshot {
  const valor = useContext(SnapshotContext);
  if (!valor) throw new Error('useSnapshot debe usarse dentro de SnapshotProvider');
  return valor;
}
