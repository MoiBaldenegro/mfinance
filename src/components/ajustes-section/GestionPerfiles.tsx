import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { perfilPort } from '../../adapters/perfil-ipc-adapter.ts';
import { crearPerfil } from '../../domain/use-cases/crear-perfil.ts';
import { usarPerfiles } from '../../hooks/use-perfil.ts';
import { useSnapshot } from '../shell/SnapshotProvider';
import { navegarA, mostrarToast } from '../../lib/bus-ui.ts';
import { OnboardingWizard } from '../onboarding/OnboardingWizard.tsx';
import { PerfilFila, pasoGuardado } from './PerfilFila.tsx';
import type { OnboardingData } from '../../domain/entities/onboarding/index.ts';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import { activarPerfil } from './activar-perfil.ts';
import { capturarContexto } from '../../domain/use-cases/rollback-perfil-vista.ts';
import { usarSeccionActiva } from '../../hooks/use-seccion-activa.ts';
import '../../styles/gestion-perfiles.css';

interface WizardState {
  readonly perfilId?: string;
  readonly reanudar?: boolean;
  readonly pasoInicial?: number;
  readonly datosIniciales?: OnboardingData;
  readonly metasIniciales?: readonly GoalEntry[];
}
export function GestionPerfiles() {
  const { perfiles, activo, avisoCarga, fijarActivo, refrescar } = usarPerfiles();
  const { recargar, cargarParaCambio, esCargaVigente, generacionActual, publicarSnapshot,
    mostrarError, registrarReintento, mostrarFalloPerfil } = useSnapshot();
  const { activa, elegir } = usarSeccionActiva();
  const [nombre, setNombre] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  const [mostrarWizard, setMostrarWizard] = useState<WizardState | null>(null);
  const cambioEnVuelo = useRef(false);
  const [cambiando, setCambiando] = useState(false);
  const cerrarYNavegar = () => {
    setMostrarWizard(null); recargar(); refrescar(); navegarA('registro');
  };
  const darDeAlta = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const resultado = await crearPerfil(perfilPort, nombre, perfiles);
    if (!resultado.ok) { setAviso(resultado.aviso); return; }
    setAviso(null); setNombre(''); refrescar();
    setMostrarWizard({ perfilId: resultado.perfil.id, reanudar: false });
  };
  const activar = (id: string) => {
    if (!activo) return;
    void activarPerfil(id, { port: perfilPort, fijarActivo, recargar, cargarSnapshot: cargarParaCambio,
      esCargaVigente, generacionActual, publicarSnapshot,
      mostrarError, registrarReintento, restaurarSeccion: elegir,
      mostrarFalloPerfil,
      contexto: capturarContexto(activo.id, activa), guardia: cambioEnVuelo,
      cambiar: setCambiando, avisar: setAviso });
  };
  const reanudarOnboarding = (perfilId: string) => {
    const perfil = perfiles.find((p) => p.id === perfilId);
    setMostrarWizard({ perfilId, reanudar: true,
      datosIniciales: perfil?.onboarding_data ?? undefined,
      pasoInicial: perfil ? pasoGuardado(perfil) : 1,
      metasIniciales: perfil?.goals_journal ?? [] });
  };
  const cerrarWizardCompletado = (nombrePerfil?: string) => {
    cerrarYNavegar();
    if (nombrePerfil) mostrarToast(`Onboarding completado. ¡Bienvenido, ${nombrePerfil}!`);
  };
  const cerrarWizardSaltado = () => {
    cerrarYNavegar();
    mostrarToast('Perfil creado. Puedes completar tu onboarding después en Ajustes');
  };

  if (mostrarWizard) {
    return (
      <div className="gestion-perfiles gestion-perfiles--wizard">
        <OnboardingWizard alCompletar={cerrarWizardCompletado} alSaltar={cerrarWizardSaltado}
          datosIniciales={mostrarWizard.datosIniciales} pasoInicial={mostrarWizard.pasoInicial}
          perfilId={mostrarWizard.perfilId} metasIniciales={mostrarWizard.metasIniciales} />
      </div>
    );
  }
  return (
    <div className="gestion-perfiles">
      <span className="ajustes-section__tema-etiqueta">Perfiles</span>
      {avisoCarga ? <p className="gestion-perfiles__aviso" role="alert">{avisoCarga}</p> : null}
      <ul className="gestion-perfiles__lista">
        {perfiles.map((perfil) => (
          <PerfilFila key={perfil.id} perfil={perfil} esActivo={perfil.id === activo?.id}
            onActivar={(id) => void activar(id)} onReanudar={reanudarOnboarding}
            deshabilitada={cambiando} />
        ))}
      </ul>
      <form className="gestion-perfiles__alta" onSubmit={(e) => void darDeAlta(e)}>
        <input className="gestion-perfiles__campo" value={nombre}
          placeholder="Nombre del nuevo perfil" aria-label="Nombre del nuevo perfil"
          onChange={(e) => setNombre(e.target.value)} />
        <button type="submit" className="gestion-perfiles__crear">Crear perfil</button>
      </form>
      {aviso ? <p className="gestion-perfiles__aviso" role="alert">{aviso}</p> : null}
    </div>
  );
}
