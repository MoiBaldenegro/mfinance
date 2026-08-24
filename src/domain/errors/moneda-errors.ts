// REQ-19-05: error nombrado del dominio para una moneda recibida fuera
// del catálogo cerrado MXN/USD/EUR. Nunca fallos silenciosos.

/** La moneda recibida no pertenece al catálogo (p. ej. "GBP"). */
export class MonedaFueraCatalogoError extends Error {
  /** Código recibido tal cual, citado en el mensaje. */
  readonly codigo: string;

  constructor(codigo: string) {
    super(`moneda fuera del catálogo (MXN USD EUR): "${codigo}"`);
    this.name = 'MonedaFueraCatalogoError';
    this.codigo = codigo;
  }
}
