// Sustituto del adapter Tauri IPC de perfiles para la integración real:
// misma forma de PerfilPort, sin invoke(). El loader redirige aquí.
import { escenario, perfilPorId } from './escenario-falso.mjs';

export const perfilPort = {
  async listar() {
    return escenario.perfiles;
  },
  async activo() {
    return perfilPorId(escenario.activaId);
  },
  async crear(nombre) {
    const creado = { id: `p-${escenario.perfiles.length + 1}`, nombre,
      creado_en: '2026-08-25' };
    escenario.perfiles.push(creado);
    return creado;
  },
  async seleccionar(id) {
    escenario.selecciones.push(id);
    escenario.activaId = id;
    return perfilPorId(id);
  },
};
