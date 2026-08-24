// Puerto del núcleo frontend: espejo del trait SnapshotRepository de
// src-tauri/src/domain/repository.rs más las operaciones derivadas que
// el backend calcula (serie P&G, balance, plan de deuda, indicadores, proyección inversiones, conciliación, proyección PyG).
// Lo implementa el adapter IPC y lo consumen los casos de uso; nada más conoce el transporte.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { SeriePyg } from '../entities/pyg-serie.ts';
import type { BalanceCompleto } from '../entities/balance-serie.ts';
import type { PlanDeuda } from '../entities/plan-deuda.ts';
import type { Indicadores } from '../entities/indicadores.ts';
import type { CategoriaActivo } from '../entities/asset.ts';
import type { ProyeccionInversiones } from '../entities/proyeccion-inversiones.ts';
import type { Movement } from '../entities/account-statement.ts';
import type { ConciliacionMensual } from '../entities/conciliacion-mensual.ts';
import type { HistoricoConciliacion } from '../entities/conciliacion-mensual.ts';
import type { ProyeccionPyg, BalanceFuturo, SupuestosProyeccion } from '../entities/pyg-proyeccion.ts';
import type { PerfilActivoConOnboarding } from '../entities/onboarding/index.ts';

export interface SnapshotPort {
  /** Recupera el snapshot vigente desde el backend. */
  load(): Promise<FinanceSnapshot>;
  /** Persiste el snapshot recibido como estado vigente. */
  save(snapshot: FinanceSnapshot): Promise<void>;
  /** Copia el JSON vigente a `destination` y devuelve la ruta escrita. */
  export(destination: string): Promise<string>;
  /** Restaura el vigente desde `origin` y devuelve el snapshot importado. */
  import(origin: string): Promise<FinanceSnapshot>;
  /** REQ-07-01: serie mensual P&G calculada sobre el estado vigente. */
  pygSerie(): Promise<SeriePyg>;
  /** REQ-08-03/05: balance completo (totales + serie mensual) sobre el estado vigente. */
  balanceSerie(): Promise<BalanceCompleto>;
  /** REQ-09-01/02/03: plan de deuda (orden avalancha/bola, proyección, métricas). */
  planDeuda(): Promise<PlanDeuda>;
  /** REQ-10-01..05: indicadores semáforo (endeudamiento, tasa ahorro, fondo emergencia, ingreso pasivo). */
  indicadores(): Promise<Indicadores>;
  /** REQ-11-02: proyección de inversiones a 5/10/20 años con interés compuesto. */
  inversionesProyeccion(): Promise<ProyeccionInversiones>;
  /** REQ-08-01: crea o actualiza un activo. */
  assetUpsert(
    nombre: string,
    categoria: CategoriaActivo,
    valorActual: number,
  ): Promise<FinanceSnapshot>;
  /** REQ-08-01: elimina un activo por nombre. */
  assetEliminar(nombre: string): Promise<FinanceSnapshot>;
  /** REQ-08-02: crea o actualiza un pasivo. */
  liabilityUpsert(
    nombre: string,
    saldoPendiente: number,
    tasaInteresAnual: number,
  ): Promise<FinanceSnapshot>;
  /** REQ-08-02: elimina un pasivo por nombre. */
  liabilityEliminar(nombre: string): Promise<FinanceSnapshot>;
  /** REQ-13-01..07: conciliación mensual para un mes (YYYY-MM). */
  conciliacionMensual(mes: string): Promise<ConciliacionMensual>;
  /** REQ-13-05: agregar movimiento a una cuenta y recalcular. */
  conciliacionAgregarMovimiento(
    mes: string,
    cuenta: string,
    movimiento: Movement,
  ): Promise<FinanceSnapshot>;
  /** REQ-13-07: histórico mensual de conciliación. */
  conciliacionHistorico(): Promise<HistoricoConciliacion>;
  /** REQ-14-01: proyección PyG 12 meses con supuestos editables. */
  pygProyeccion(supuestos: SupuestosProyeccion): Promise<ProyeccionPyg>;
  /** REQ-14-02: balance futuro 12 meses con amortización pasivos. */
  balanceFuturo(supuestos: SupuestosProyeccion): Promise<BalanceFuturo>;
  /** REQ-29-01: obtiene snapshot y onboarding_status del perfil activo en una llamada. */
  obtenerPerfilActivoConOnboarding(): Promise<PerfilActivoConOnboarding>;
}
