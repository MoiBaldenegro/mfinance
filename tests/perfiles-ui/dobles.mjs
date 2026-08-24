// Doble del puerto de perfiles para las suites node de F22: Perfil de
// prueba con la forma exacta que cruza el IPC (id, nombre, creado_en).

/** Construye un Perfil de prueba a partir del nombre. */
export function perfilFalso(nombre, id = `p_${nombre.toLowerCase()}`) {
  return { id, nombre, creado_en: '2026-08-23T12:00:00Z' };
}
