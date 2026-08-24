// Espejo de src-tauri/src/domain/account_statement.rs: estado de cuenta
// para conciliación (saldo teórico = inicial + suma algebraica).

/** Movimiento bancario con importe algebraico (negativo = cargo). */
export interface Movement {
  readonly fecha: string;
  readonly concepto: string;
  readonly importe: number;
}

/** Estado de cuenta de una titular para conciliar hasta cuadrar. */
export interface AccountStatement {
  readonly cuenta: string;
  readonly saldo_inicial: number;
  readonly movimientos: readonly Movement[];
  readonly saldo_final: number;
}

/** Saldo teórico: inicial más suma algebraica de movimientos. */
export function saldoTeorico(estado: AccountStatement): number {
  const movimientos = estado.movimientos.reduce<number>(
    (total, movimiento) => total + movimiento.importe,
    0,
  );
  return estado.saldo_inicial + movimientos;
}

/** Diferencia exacta entre el saldo real y el teórico. */
export function diferencia(estado: AccountStatement): number {
  return estado.saldo_final - saldoTeorico(estado);
}

/** Conciliada cuando real y teórico coinciden (tolerancia medio céntimo). */
export function estaConciliada(estado: AccountStatement): boolean {
  return Math.abs(diferencia(estado)) < 0.005;
}
