import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import { SnapshotLoadError } from '../errors/snapshot-errors.ts';
import type { SnapshotPort } from '../ports/snapshot-port.ts';
import { cargarPerfilActivo } from './cargar-perfil-activo.ts';
import type { CargaAislada, ResultadoPerfilActivo } from './cargar-perfil-activo.ts';
import { crearGuardiaGeneracion, crearPublicadorEstado } from './snapshot-generacion.ts';

export interface ControladorSnapshot {
  readonly solicitar: (mostrarError: boolean) => Promise<CargaAislada>;
  readonly esCargaVigente: (generacion: number) => boolean;
  readonly generacionActual: () => number;
  readonly publicarSnapshot: (carga: CargaAislada, comprometer: () => void) => boolean;
  readonly mostrarError: (error: SnapshotLoadError, generacion: number) => boolean;
  readonly aplicarSnapshot: (snapshot: FinanceSnapshot, generacion?: number) => boolean;
}

export function crearControladorSnapshot<T>(
  port: Pick<SnapshotPort, 'obtenerPerfilActivoConOnboarding'>,
  estadoDeResultado: (resultado: ResultadoPerfilActivo) => T,
  estadoDeSnapshot: (snapshot: FinanceSnapshot) => T,
  publicarEstado: (estado: T) => void,
  estadoCargando: T,
): ControladorSnapshot {
  const guardia = crearGuardiaGeneracion();
  const publicaciones = crearPublicadorEstado(guardia, publicarEstado);
  const solicitar = async (mostrarError: boolean): Promise<CargaAislada> => {
    const generacion = guardia.iniciar();
    publicarEstado(estadoCargando);
    const resultado = await cargarPerfilActivo(port);
    const carga = { generacion, resultado };
    if (resultado.ok || mostrarError) publicaciones.publicar(generacion, estadoDeResultado(resultado));
    return carga;
  };
  return {
    solicitar,
    esCargaVigente: guardia.esVigente,
    generacionActual: guardia.actual,
    publicarSnapshot: (carga, comprometer) => carga.resultado.ok
      && publicaciones.publicarComprometido(carga.generacion, estadoDeResultado(carga.resultado), comprometer),
    mostrarError: (error, generacion) => publicaciones.publicar(generacion, { nombre: 'error', error } as T),
    aplicarSnapshot: (snapshot, generacion = guardia.actual()) =>
      publicaciones.publicar(generacion, estadoDeSnapshot(snapshot)),
  };
}
