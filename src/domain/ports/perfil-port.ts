// REQ-22-01: puerto del núcleo frontend para el registro de perfiles.
// Lo define el dominio (puro, sin frameworks) y lo implementa el
// adapter Tauri IPC; los casos de uso y la UI lo consumen inyectada o
// vía su instancia única. Espejo de los commands listar_perfiles
// perfil_activo crear_perfil seleccionar_perfil del backend.
import type { Perfil } from '../entities/perfil.ts';

export interface PerfilPort {
  /** Lista los perfiles registrados, en orden de creación. */
  listar(): Promise<Perfil[]>;
  /** Perfil activo actual, o null si todavía no hay ninguno. */
  activo(): Promise<Perfil | null>;
  /** Da de alta un perfil nuevo; vacío/duplicado → error nombrado. */
  crear(nombre: string): Promise<Perfil>;
  /** Activa el perfil cuyo id coincide; error nombrado si no existe. */
  seleccionar(id: string): Promise<Perfil>;
}
