// Puerto del núcleo frontend para la preferencia de tema (REQ-17-07):
// lo define el dominio y lo implementa un adapter de almacenamiento local.
// La preferencia vive FUERA del snapshot: no toca StrategySettings ni el
// esquema Rust ni los commands.
import type { Tema } from '../entities/tema.ts';

export interface TemaPort {
  /**
   * Preferencia CRUDA almacenada (string libre, puede estar corrupta) o
   * null si no existe. La validación es del caso de uso resolver-tema.
   */
  leer(): string | null;
  /** Guarda la elección ya resuelta a un tema válido. */
  guardar(tema: Tema): void;
}
