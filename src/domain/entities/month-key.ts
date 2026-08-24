// Espejo de src-tauri/src/domain/month_key.rs: clave YYYY-MM validada.

/** Error nombrado para claves fuera del formato YYYY-MM o mes inválido. */
export class InvalidMonthKeyError extends Error {
  /** Texto recibido tal cual. */
  readonly valor: string;

  constructor(valor: string) {
    super(`clave de mes inválida (se espera YYYY-MM): "${valor}"`);
    this.name = 'InvalidMonthKeyError';
    this.valor = valor;
  }
}

/** Cadena YYYY-MM ya validada (año de 4 dígitos, mes 01..12). */
export type MonthKey = string;

function sonDigitos(texto: string): boolean {
  return /^\d+$/.test(texto);
}

/**
 * Valida y devuelve la clave de mes; rechaza lo inválido con error
 * nombrado, igual que `MonthKey::parse` en el backend.
 */
export function parseMonthKey(raw: string): MonthKey {
  const partes = raw.split('-');
  if (partes.length !== 2) throw new InvalidMonthKeyError(raw);
  const [anio, mes] = partes;
  if (anio.length !== 4 || !sonDigitos(anio)) {
    throw new InvalidMonthKeyError(raw);
  }
  if (mes.length !== 2 || !sonDigitos(mes)) {
    throw new InvalidMonthKeyError(raw);
  }
  const numeroMes = Number(mes);
  if (!Number.isInteger(numeroMes) || numeroMes < 1 || numeroMes > 12) {
    throw new InvalidMonthKeyError(raw);
  }
  return raw;
}
