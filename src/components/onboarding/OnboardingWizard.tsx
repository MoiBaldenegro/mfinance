// REQ-24-04/25-01/26-01/27-01: shell del wizard de onboarding con barra
// de progreso 5 pasos, navegación Atrás/Siguiente/Finalizar onboarding/
// Saltar y reanudación con datos iniciales. El contenido de cada paso
// vive en WizardContenido (regla dura ≤100 líneas).
import { useCallback, useMemo, useState } from 'react';
import { useOnboarding } from '../../hooks/use-onboarding.ts';
import { WizardErrorCarga } from './WizardErrorCarga.tsx';
import { WizardContenido } from './WizardContenido.tsx';
import { esPaso1Completo } from './validarPaso.ts';
import type { OnboardingData } from '../../domain/entities/onboarding/index.ts';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import '../../styles/onboarding-wizard.css';

const PASOS = [
  { id: 1, titulo: 'Datos personales', key: 'paso1' },
  { id: 2, titulo: 'Balance inicial', key: 'paso2' },
  { id: 3, titulo: 'Deuda y proyección', key: 'paso3' },
  { id: 4, titulo: 'Umbrales y metas', key: 'paso4' },
  { id: 5, titulo: 'Resumen y finalizar', key: 'paso5' },
] as const;

export interface OnboardingWizardProps {
  readonly alCompletar: (nombre?: string) => void;
  readonly alSaltar: () => void;
  /** Datos iniciales de onboarding (para reanudar). */
  readonly datosIniciales?: OnboardingData;
  /** Paso inicial (para reanudar en el paso guardado). */
  readonly pasoInicial?: number;
  /** Perfil del backend que está completando el wizard. */
  readonly perfilId?: string;
  /** Journal inicial del perfil reanudado (REQ-27-09). */
  readonly metasIniciales?: readonly GoalEntry[];
}

export function OnboardingWizard({
  alCompletar, alSaltar, datosIniciales, pasoInicial = 1, perfilId, metasIniciales,
}: OnboardingWizardProps) {
  const {
    currentStep, pasoActual, paso2Actual, paso3Actual, paso4Actual, datos,
    guardando, operacionEnCurso, errorCarga, siguientePaso, pasoAnterior, actualizarPaso1,
    actualizarPaso2, actualizarPaso3, actualizarPaso4, completar, saltar, recargar,
  } = useOnboarding({ datosIniciales, pasoInicial, perfilId });
  const [metas, setMetas] = useState<readonly GoalEntry[]>(metasIniciales ?? []);
  const info = useMemo(() => PASOS.find((p) => p.id === currentStep) ?? PASOS[0], [currentStep]);
  // Solo el paso 1 exige datos mínimos; los pasos 2-5 son opcionales.
  const pasoValido = useMemo(() => {
    if (!pasoActual) return false;
    if (currentStep === 1) return esPaso1Completo(pasoActual);
    if (currentStep === 3) return true;
    return true;
  }, [pasoActual, currentStep]);
  const esUltimoPaso = currentStep === 5;

  const manejarSiguiente = useCallback(async () => {
    if (!esUltimoPaso) { siguientePaso(); return; }
    const r = await completar();
    if (r.ok) alCompletar(r.nombre);
  }, [esUltimoPaso, siguientePaso, completar, alCompletar]);
  const manejarSaltar = useCallback(async () => {
    const r = await saltar();
    if (r.ok) alSaltar();
  }, [saltar, alSaltar]);

  if (errorCarga) {
    return <WizardErrorCarga mensaje={errorCarga} alReintentar={recargar} />;
  }

  return (
    <div className="onboarding-wizard">
      <nav className="onboarding-wizard__progreso" aria-label="Progreso del onboarding">
        <ol className="onboarding-wizard__pasos">
          {PASOS.map((p) => (
            <li key={p.id} className={`onboarding-wizard__paso ${p.id === currentStep ? 'onboarding-wizard__paso--actual' : ''} ${p.id < currentStep ? 'onboarding-wizard__paso--completado' : ''}`}><span className="onboarding-wizard__paso-numero">{p.id}</span><span className="onboarding-wizard__paso-titulo">{p.titulo}</span></li>
          ))}
        </ol>
        <div className="onboarding-wizard__barra">
          <div className="onboarding-wizard__barra-progreso" style={{ '--progreso': `${((currentStep - 1) / 4) * 100}%` } as React.CSSProperties} aria-hidden="true" />
        </div>
      </nav>
      <WizardContenido
        keyPaso={info.key} titulo={info.titulo} pasoId={info.id}
        datos={datos} pasoActual={pasoActual} paso2Actual={paso2Actual}
        paso3Actual={paso3Actual} paso4Actual={paso4Actual}
        alCambiarPaso1={actualizarPaso1} alCambiarPaso2={actualizarPaso2}
        alCambiarPaso3={actualizarPaso3} alCambiarPaso4={actualizarPaso4}
        metas={metas} alCambiarMetas={setMetas} deshabilitado={operacionEnCurso}
        perfilId={perfilId} alSaltar={() => void manejarSaltar()}
      />
      <footer className="onboarding-wizard__navegacion">
        <button className="onboarding-wizard__btn onboarding-wizard__btn--atras" onClick={pasoAnterior} disabled={currentStep === 1 || operacionEnCurso} aria-disabled={currentStep === 1 || operacionEnCurso}>Atrás</button>
        <div className="onboarding-wizard__acciones-principales">
          {currentStep === 1 && <button className="onboarding-wizard__btn onboarding-wizard__btn--saltar" onClick={() => void manejarSaltar()} disabled={operacionEnCurso}>Saltar onboarding</button>}
          <button className={`onboarding-wizard__btn onboarding-wizard__btn--principal ${!pasoValido ? 'onboarding-wizard__btn--deshabilitado' : ''}`} onClick={() => void manejarSiguiente()} disabled={!pasoValido || operacionEnCurso} aria-disabled={!pasoValido || operacionEnCurso}>{esUltimoPaso ? 'Finalizar onboarding' : 'Siguiente'}</button>
        </div>
      </footer>
      {guardando && <div className="onboarding-wizard__guardando" aria-live="polite">Guardando cambios…</div>}
    </div>
  );
}
