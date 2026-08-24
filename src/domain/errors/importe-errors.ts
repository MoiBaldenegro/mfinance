// REQ-06-06: errores nombrados en español para importes del formulario
// mensual. Igual que el resto del dominio, nunca fallos silenciosos.

/** El texto tecleado no representa un número finito (p. ej. "abc"). */
export class ImporteNoNumericoError extends Error {
  /** Texto recibido tal cual, para citarlo junto al campo afectado. */
  readonly texto: string;

  constructor(texto: string) {
    super(`importe no numérico: "${texto}"`);
    this.name = 'ImporteNoNumericoError';
    this.texto = texto;
  }
}

/** El importe introducido es menor que cero (no permitido). */
export class ImporteNegativoError extends Error {
  /** Texto recibido tal cual, para citarlo junto al campo afectado. */
  readonly texto: string;

  constructor(texto: string) {
    super(`el importe no puede ser negativo: "${texto}"`);
    this.name = 'ImporteNegativoError';
    this.texto = texto;
  }
}
