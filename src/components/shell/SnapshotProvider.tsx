// Contexto React mínimo (design.md): snapshot compartido + acción de
// recarga que relanza el caso de uso de carga (REQ-05-03/07). Glue de UI,
// sin lógica de negocio: todo delega en src/domain/use-cases.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { OnboardingStatus } from '../../domain/entities/onboarding/index.ts';
import { SnapshotLoadError } from '../../domain/errors/snapshot-errors.ts';

/** Desenlace de la carga inicial expuesto a la UI. */
export type EstadoSnapshot =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly snapshot: FinanceSnapshot }
  | { readonly nombre: 'error'; readonly error: SnapshotLoadError }
  | { readonly nombre: 'onboarding'; readonly snapshot: FinanceSnapshot; readonly onboardingStatus: OnboardingStatus };

interface ValorSnapshot {
  readonly estado: EstadoSnapshot;
  /** Relanza el caso de uso de carga (botón Reintentar). */
  readonly recargar: () => void;
  /**
   * Publica un snapshot ya persistido (p. ej. tras Confirmar en
   * Registro) sin volver a pasar por IPC de carga.
   */
  readonly aplicarSnapshot: (snapshot: FinanceSnapshot) => void;
  /**
   * Transición explícita a AppShell tras completar onboarding:
   * recarga el snapshot fresco y cambia el estado a 'listo'.
   */
  readonly completarOnboarding: () => void;
}

const SnapshotContext = createContext<ValorSnapshot | null>(null);

/**
 * Composition root del frontend en miniatura: inyecta el adapter IPC al
 * caso de uso y publica el desenlace como estado compartido.
 */
export function SnapshotProvider(
  { children }: { readonly children: ReactNode },
) {
  const [estado, setEstado] = useState<EstadoSnapshot>({ nombre: 'cargando' });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    setEstado({ nombre: 'cargando' });
    snapshotPort.obtenerPerfilActivoConOnboarding().then((resultado) => {
      if (!vigente) return;
      setEstado({
        nombre: resultado.onboarding_status.nombre === 'Completed' ? 'listo' : 'onboarding',
        snapshot: resultado.snapshot,
        onboardingStatus: resultado.onboarding_status,
      });
    }).catch((error: unknown) => {
      if (!vigente) return;
      setEstado({ nombre: 'error', error: new SnapshotLoadError(String(error)) });
    });
    return () => {
      vigente = false;
    };
  }, [intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  const aplicarSnapshot = useCallback(
    (snapshot: FinanceSnapshot) => setEstado({ nombre: 'listo', snapshot }),
    [],
  );

  const completarOnboarding = useCallback(() => {
    setIntento((n) => n + 1);
  }, []);

  return (
    <SnapshotContext.Provider value={{ estado, recargar, aplicarSnapshot, completarOnboarding }}>
      {children}
    </SnapshotContext.Provider>
  );
}

/** Lee el estado del snapshot; falla nombrado si se usa fuera. */
export function useSnapshot(): ValorSnapshot {
  const valor = useContext(SnapshotContext);
  if (!valor) {
    throw new Error('useSnapshot debe usarse dentro de SnapshotProvider');
  }
  return valor;
}