// Espejo de src-tauri/src/domain/liability.rs: pasivo con saldo y tasa.

/** Pasivo: nombre, saldo pendiente en euros y tasa anual en %. */
export interface Liability {
  readonly nombre: string;
  readonly saldo_pendiente: number;
  readonly tasa_interes_anual: number;
}
