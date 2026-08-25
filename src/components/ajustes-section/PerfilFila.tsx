// REQ-22-04/05 + REQ-27-09: fila de la lista de perfiles en Ajustes.
// Muestra el titular, badge «Onboarding en progreso» y acciones
// Activar / Reanudar onboarding según el estado del perfil.
import type { Perfil } from '../../domain/entities/perfil.ts';
import '../../styles/perfil-fila.css';

interface Props {
  readonly perfil: Perfil;
  readonly esActivo: boolean;
  readonly onActivar: (id: string) => void;
  readonly onReanudar: (id: string) => void;
  readonly deshabilitada?: boolean;
}

/** Extrae el paso guardado cuando el onboarding está InProgress. */
export function pasoGuardado(perfil: Perfil): number {
  return perfil.onboarding_status?.nombre === 'InProgress'
    ? perfil.onboarding_status.current_step
    : 1;
}

/** Una fila del registro de perfiles con su estado de onboarding. */
export function PerfilFila({ perfil, esActivo, onActivar, onReanudar, deshabilitada }: Props) {
  const enProgreso = perfil.onboarding_status?.nombre === 'InProgress';
  return (
    <li className={esActivo ? 'gestion-perfiles__fila gestion-perfiles__fila--activa' : 'gestion-perfiles__fila'}>
      <span className="gestion-perfiles__nombre">
        {perfil.nombre}
        {esActivo ? ' · activo' : ''}
      </span>
      {enProgreso && (
        <span className="gestion-perfiles__badge" aria-label="Onboarding sin terminar">
          Onboarding en progreso
        </span>
      )}
      <span className="gestion-perfiles__meta">creado el {perfil.creado_en.slice(0, 10)}</span>
      {!esActivo && (
        enProgreso
           ? <button type="button" className="gestion-perfiles__reanudar" disabled={deshabilitada} onClick={() => onReanudar(perfil.id)}>Reanudar onboarding</button>
           : <button type="button" className="gestion-perfiles__activar" disabled={deshabilitada} onClick={() => onActivar(perfil.id)}>Activar</button>
      )}
    </li>
  );
}
