import type { Perfil } from '../entities/perfil.ts';
import type { PerfilPort } from '../ports/perfil-port.ts';
import { errorPerfilDesdeRechazo, RollbackPerfilError } from '../errors/perfil-errors.ts';
import type { CargaAislada } from './cargar-perfil-activo.ts';
export interface ContextoAnterior { readonly perfilId: string; readonly seccion: string; }
export function capturarContexto(perfilId: string, seccion: string): ContextoAnterior {
  return Object.freeze({ perfilId, seccion });
}
export type ResultadoCambio =
  | { readonly ok: true; readonly perfil: Perfil; readonly rollback: boolean }
  | { readonly ok: false; readonly fase: 'snapshot-nuevo-pendiente'; readonly error: Error;
      readonly perfil: Perfil; readonly rollback: () => Promise<ResultadoCambio> }
  | { readonly ok: false; readonly fase: string; readonly error: Error; readonly recuperado?: boolean; readonly perfil?: Perfil };
interface DependenciasCambio {
  readonly perfilPort: Pick<PerfilPort, 'seleccionar'>;
  readonly cargarSnapshot: () => Promise<CargaAislada>;
  readonly esCargaVigente: (generacion: number) => boolean;
  readonly publicarSnapshot: (carga: CargaAislada, comprometer: () => void) => boolean;
  readonly generacionActual: () => number;
  readonly contexto: ContextoAnterior;
  readonly objetivoId: string;
  readonly alIniciar: () => void;
  readonly alFase: (fase: 'rollback') => void;
  readonly alFinalizar: () => void;
  readonly alConfirmar: (perfil: Perfil) => void;
  readonly alRestaurarVista: (seccion: string) => void;
  readonly alError: (fase: string, error: Error, generacion: number, reintentar: () => Promise<ResultadoCambio>) => void;
  readonly alCancelar: () => void;
}
type ResultadoCarga =
  | { readonly ok: true; readonly carga: CargaAislada }
  | { readonly ok: false; readonly error: Error; readonly obsoleta: boolean; readonly generacion: number };
async function cargar(deps: DependenciasCambio): Promise<ResultadoCarga> {
  try {
    const carga = await deps.cargarSnapshot();
    if (!deps.esCargaVigente(carga.generacion)) {
      return { ok: false, error: new Error('respuesta de carga obsoleta'), obsoleta: true, generacion: carga.generacion };
    }
    if (!carga.resultado.ok) return { ok: false, error: carga.resultado.error, obsoleta: false, generacion: carga.generacion };
    return { ok: true, carga };
  } catch (error: unknown) {
    return { ok: false, error: error instanceof Error ? error : new Error(String(error)), obsoleta: false, generacion: deps.generacionActual() };
  }
}
export async function ejecutarCambioPerfil(deps: DependenciasCambio): Promise<ResultadoCambio> {
  let nuevo: Perfil;
  try {
    nuevo = await deps.perfilPort.seleccionar(deps.objetivoId);
  } catch (error: unknown) {
    deps.alCancelar();
    return { ok: false, fase: 'seleccion', error: errorPerfilDesdeRechazo(error) };
  }
  deps.alIniciar();
  const cargaNueva = await cargar(deps);
  if (cargaNueva.ok) {
    if (!deps.publicarSnapshot(cargaNueva.carga, () => deps.alConfirmar(nuevo))) {
      return { ok: false, fase: 'obsoleta', error: new Error('publicación obsoleta') };
    }
    deps.alFinalizar();
    return { ok: true, perfil: nuevo, rollback: false };
  }
  if (cargaNueva.obsoleta) return { ok: false, fase: 'obsoleta', error: cargaNueva.error };
  let rollback: Promise<ResultadoCambio> | undefined;
  return { ok: false, fase: 'snapshot-nuevo-pendiente', error: cargaNueva.error,
    perfil: nuevo, rollback: () => rollback ??= ejecutarRollback(deps).catch((error) => {
      rollback = undefined; throw error; }) };
}
export async function ejecutarRollback(deps: DependenciasCambio, yaIniciado = false,
  generacionInicial = deps.generacionActual(), falloOriginal?: Error): Promise<ResultadoCambio> {
  if (!yaIniciado) deps.alIniciar();
  deps.alFase('rollback');
  let anterior: Perfil;
  try {
    anterior = await deps.perfilPort.seleccionar(deps.contexto.perfilId);
  } catch (error: unknown) {
    const fallo = new RollbackPerfilError(
      'rollback-seleccion', errorPerfilDesdeRechazo(error).message,
    );
    deps.alError('rollback-seleccion', fallo, generacionInicial, () => ejecutarRollback(deps));
    return { ok: false, fase: 'rollback-seleccion', error: fallo };
  }

  const cargaAnterior = await cargar(deps);
  if (!cargaAnterior.ok) {
    if (cargaAnterior.obsoleta) return { ok: false, fase: 'obsoleta', error: cargaAnterior.error };
    const fallo = new RollbackPerfilError('rollback-carga', cargaAnterior.error.message);
    deps.alError('rollback-carga', fallo, cargaAnterior.generacion, () => ejecutarRollback(deps));
    return { ok: false, fase: 'rollback-carga', error: fallo };
  }
  const comprometer = () => {
    deps.alConfirmar(anterior);
    deps.alRestaurarVista(deps.contexto.seccion);
  };
  if (!deps.publicarSnapshot(cargaAnterior.carga, comprometer)) {
    return { ok: false, fase: 'obsoleta', error: new Error('publicación obsoleta') };
  }
  deps.alFinalizar();
  if (falloOriginal) return { ok: false, fase: 'snapshot-nuevo', error: falloOriginal, recuperado: true, perfil: anterior };
  return { ok: true, perfil: anterior, rollback: true };
}
