// Espejo de src-tauri/src/domain/asset.rs: activo patrimonial.

/** Categoría del activo patrimonial. */
export type CategoriaActivo = 'liquido' | 'inversion' | 'propiedad';

/** Activo patrimonial: nombre legible, categoría y valor actual en euros. */
export interface Asset {
  readonly nombre: string;
  readonly categoria: CategoriaActivo;
  readonly valor_actual: number;
}
