// Escenario compartido por los adapters falsos del harness de integración:
// simula el registro de perfiles y los snapshots que llegan por IPC.
export const ana = { id: 'p-ana', nombre: 'Ana', creado_en: '2026-01-01' };
export const beto = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };

export const escenario = {
  perfiles: [ana, beto],
  activaId: ana.id,
  selecciones: [],
  cargas: 0,
  /** Cargas fallidas pendientes del perfil de Ana (rollback roto). */
  fallosAna: 0,
};

export function perfilPorId(id) {
  return escenario.perfiles.find((perfil) => perfil.id === id) ?? null;
}
