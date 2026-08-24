// Puerto del núcleo frontend para el cierre mensual guiado (REQ-16):
// lo define el dominio y lo implementa el adapter IPC. Las escrituras
// devuelven el snapshot persistido para publicarlo en el provider.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import type { PeticionCierre, Recomendacion, ResumenCierre } from '../entities/cierre.ts';

export interface CierrePort {
  /** REQ-16-01/02: resumen del wizard para el mes que se cierra. */
  resumenCierre(mes: string): Promise<ResumenCierre>;
  /** REQ-16-03/08: confirma el cierre y devuelve el snapshot actualizado. */
  confirmarCierre(peticion: PeticionCierre): Promise<FinanceSnapshot>;
  /** REQ-16-07: reapertura explícita de un mes cerrado. */
  reabrirMes(mes: string): Promise<FinanceSnapshot>;
  /** REQ-16-04/05: recomendaciones vigentes sobre los datos actuales. */
  consejosVigentes(): Promise<readonly Recomendacion[]>;
}
