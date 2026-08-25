export interface GuardiaGeneracion {
  readonly iniciar: () => number;
  readonly actual: () => number;
  readonly esVigente: (generacion: number) => boolean;
}

export function crearGuardiaGeneracion(): GuardiaGeneracion {
  let generacion = 0;
  return {
    iniciar: () => ++generacion,
    actual: () => generacion,
    esVigente: (candidata) => candidata === generacion,
  };
}

/** Ejecuta una publicación solo si todavía pertenece a la solicitud vigente. */
export function publicarSiVigente(
  guardia: GuardiaGeneracion,
  generacion: number,
  publicar: () => void,
): boolean {
  if (!guardia.esVigente(generacion)) return false;
  publicar();
  return true;
}

export function crearPublicadorEstado<T>(
  guardia: GuardiaGeneracion,
  publicar: (estado: T) => void,
): { readonly publicar: (generacion: number, estado: T) => boolean; readonly publicarComprometido: (generacion: number, estado: T, comprometer: () => void) => boolean } {
  return {
    publicar: (generacion, estado) => publicarSiVigente(guardia, generacion, () => publicar(estado)),
    publicarComprometido: (generacion, estado, comprometer) => publicarSiVigente(
      guardia, generacion, () => { comprometer(); publicar(estado); }),
  };
}
