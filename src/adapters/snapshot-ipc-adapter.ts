// REQ-05-02: ÚNICO módulo del frontend que invoca invoke(). Expone las
// operaciones tipadas del puerto SnapshotPort contra los commands reales
// de src-tauri/src/commands/ (load_state save_state export_json
// import_json pyg_serie balance_serie plan_deuda indicadores
// inversiones_proyeccion_cmd asset_upsert asset_eliminar liability_upsert
// liability_eliminar conciliacion_mensual_cmd conciliacion_agregar_movimiento
// conciliacion_historico_cmd pyg_proyeccion balance_futuro
// obtener_perfil_activo_con_onboarding) reconstruyendo sus errores nombrados.
import { invoke } from '@tauri-apps/api/core';
import type { FinanceSnapshot } from '../domain/entities/finance-snapshot.ts';
import type { SeriePyg } from '../domain/entities/pyg-serie.ts';
import type { BalanceCompleto } from '../domain/entities/balance-serie.ts';
import type { PlanDeuda } from '../domain/entities/plan-deuda.ts';
import type { Indicadores } from '../domain/entities/indicadores.ts';
import type { ProyeccionInversiones } from '../domain/entities/proyeccion-inversiones.ts';
import type { CategoriaActivo } from '../domain/entities/asset.ts';
import type { Movement } from '../domain/entities/account-statement.ts';
import type { ConciliacionMensual } from '../domain/entities/conciliacion-mensual.ts';
import type { HistoricoConciliacion } from '../domain/entities/conciliacion-mensual.ts';
import type { ProyeccionPyg, BalanceFuturo, SupuestosProyeccion } from '../domain/entities/pyg-proyeccion.ts';
import type { PerfilActivoConOnboarding } from '../domain/entities/onboarding/index.ts';
import { supuestosACable } from './supuestos-cable.ts';
import {
  errorDesdeCodigoIpc,
  motivoDeRechazoIpc,
} from '../domain/errors/snapshot-errors.ts';
import type { SnapshotPort } from '../domain/ports/snapshot-port.ts';

/** Llama a un command y convierte cualquier rechazo en error nombrado. */
async function llamar<T>(
  comando: string,
  argumentos?: Record<string, unknown>,
): Promise<T> {
  try {
    return await invoke<T>(comando, argumentos);
  } catch (error: unknown) {
    const codigo = typeof error === 'object' && error !== null
      ? (error as { codigo?: unknown }).codigo
      : undefined;
    throw errorDesdeCodigoIpc(codigo, motivoDeRechazoIpc(error));
  }
}

/** Adapter Tauri IPC del puerto de snapshot (composition root lo inyecta). */
class SnapshotIpcAdapter implements SnapshotPort {
  load(): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('load_state');
  }

  async save(snapshot: FinanceSnapshot): Promise<void> {
    await llamar('save_state', { snapshot });
  }

  export(destination: string): Promise<string> {
    return llamar<string>('export_json', { destination });
  }

  import(origin: string): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('import_json', { origin });
  }

  pygSerie(): Promise<SeriePyg> {
    return llamar<SeriePyg>('pyg_serie');
  }

  balanceSerie(): Promise<BalanceCompleto> {
    return llamar<BalanceCompleto>('balance_serie');
  }

  planDeuda(): Promise<PlanDeuda> {
    return llamar<PlanDeuda>('plan_deuda');
  }

  indicadores(): Promise<Indicadores> {
    return llamar<Indicadores>('indicadores');
  }

  /** REQ-11-02: proyección de inversiones a 5/10/20 años con interés compuesto. */
  inversionesProyeccion(): Promise<ProyeccionInversiones> {
    return llamar<ProyeccionInversiones>('inversiones_proyeccion_cmd');
  }

  assetUpsert(
    nombre: string,
    categoria: CategoriaActivo,
    valorActual: number,
  ): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('asset_upsert', {
      nombre,
      categoria,
      valorActual,
    });
  }

  assetEliminar(nombre: string): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('asset_eliminar', { nombre });
  }

  liabilityUpsert(
    nombre: string,
    saldoPendiente: number,
    tasaInteresAnual: number,
  ): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('liability_upsert', {
      nombre,
      saldoPendiente,
      tasaInteresAnual,
    });
  }

  liabilityEliminar(nombre: string): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('liability_eliminar', { nombre });
  }

  /** REQ-13-01..07: conciliación mensual para un mes (YYYY-MM). */
  conciliacionMensual(mes: string): Promise<ConciliacionMensual> {
    return llamar<ConciliacionMensual>('conciliacion_mensual_cmd', { mes });
  }

  /** REQ-13-05: agregar movimiento a una cuenta y recalcular. */
  conciliacionAgregarMovimiento(
    mes: string,
    cuenta: string,
    movimiento: Movement,
  ): Promise<FinanceSnapshot> {
    return llamar<FinanceSnapshot>('conciliacion_agregar_movimiento', {
      mes,
      cuenta,
      movimiento,
    });
  }

  /** REQ-13-07: histórico mensual de conciliación. */
  conciliacionHistorico(): Promise<HistoricoConciliacion> {
    return llamar<HistoricoConciliacion>('conciliacion_historico_cmd');
  }

  /** REQ-14-01: proyección PyG 12 meses con supuestos editables. */
  pygProyeccion(supuestos: SupuestosProyeccion): Promise<ProyeccionPyg> {
    return llamar<ProyeccionPyg>('pyg_proyeccion', { supuestos: supuestosACable(supuestos) });
  }

  /** REQ-14-02: balance futuro 12 meses con amortización pasivos. */
  balanceFuturo(supuestos: SupuestosProyeccion): Promise<BalanceFuturo> {
    return llamar<BalanceFuturo>('balance_futuro', { supuestos: supuestosACable(supuestos) });
  }

  /** REQ-29-01: obtiene snapshot y onboarding_status del perfil activo en una llamada. */
  obtenerPerfilActivoConOnboarding(): Promise<PerfilActivoConOnboarding> {
    return llamar<PerfilActivoConOnboarding>('obtener_perfil_activo_con_onboarding');
  }
}

/** Instancia única del puerto para toda la app. */
export const snapshotPort: SnapshotPort = new SnapshotIpcAdapter();
