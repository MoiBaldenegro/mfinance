// REQ-19-03: entidad-catálogo de monedas, espejo exacto del enum Rust
// `Currency` (src-tauri/src/domain/currency.rs). Sin imports externos.
//
// La moneda re-etiqueta la visualización; nunca convierte importes.
// Tabla fuente: progress/research/config-monedas-perfiles.md §4.

/** Divisas cerradas del catálogo, códigos tal cual viajan por IPC. */
export const MONEDAS = ['MXN', 'USD', 'EUR'] as const;

/** Moneda de visualización del snapshot. */
export type Moneda = typeof MONEDAS[number];

/** Convención de formato de una divisa del catálogo. */
export interface InfoMoneda {
  /** Símbolo monetario ($ €). */
  readonly simbolo: string;
  /** Separador de miles (, para MXN/USD, . para EUR). */
  readonly separador_miles: string;
  /** Separador decimal (. para MXN/USD, , para EUR). */
  readonly separador_decimal: string;
  /** true = símbolo antes ($1); false = símbolo después con espacio. */
  readonly simbolo_antes: boolean;
}

/** Catálogo espejo del enum Rust: mismas divisas y misma convención. */
export const CATALOGO_MONEDAS: Record<Moneda, InfoMoneda> = {
  MXN: {
    simbolo: '$',
    separador_miles: ',',
    separador_decimal: '.',
    simbolo_antes: true,
  },
  USD: {
    simbolo: '$',
    separador_miles: ',',
    separador_decimal: '.',
    simbolo_antes: true,
  },
  EUR: {
    simbolo: '€',
    separador_miles: '.',
    separador_decimal: ',',
    simbolo_antes: false,
  },
};

/** Etiquetas en español para el selector de Ajustes (REQ-20-01). */
export const ETIQUETA_MONEDA: Record<Moneda, string> = {
  MXN: 'Pesos mexicanos',
  USD: 'Dólares',
  EUR: 'Euros',
};

/** Símbolo de una divisa del catálogo (atajo para sufijos y cabeceras). */
export function simboloDe(moneda: Moneda): string {
  return CATALOGO_MONEDAS[moneda].simbolo;
}
