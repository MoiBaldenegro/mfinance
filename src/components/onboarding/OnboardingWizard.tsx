// REQ-24-04/25-01/26-01/27-01: shell del wizard de onboarding: indicador
// de 5 pasos, tarjeta con la cabecera del paso, contenido y barra de
// navegación Atrás / Saltar / Siguiente / Finalizar onboarding. El
// contenido de cada paso vive en WizardContenido.
import { useCallback, useState } from 'react';
import { useOnboarding } from '../../hooks/use-onboarding.ts';
import { Icono } from '../shell/Icono.tsx';
import { Marca } from '../ui/Marca.tsx';
import { WizardErrorCarga } from './WizardErrorCarga.tsx';
import { WizardContenido } from './WizardContenido.tsx';
import { esPaso1Completo } from './validarPaso.ts';
import { PASOS } from './steps.ts';
import type { OnboardingData } from '../../domain/entities/onboarding/index.ts';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import '../../styles/onboarding-wizard.css';

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
  const info = PASOS.find((p) => p.id === currentStep) ?? PASOS[0];
  // Solo el paso 1 exige datos mínimos; los pasos 2-5 son opcionales.
  const pasoValido = currentStep !== 1 || esPaso1Completo(pasoActual);
  const esUltimoPaso = currentStep === PASOS.length;

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
      <header className="onboarding-wizard__bienvenida">
        <Marca tamano={56} conNombre={false} />
        <div className="onboarding-wizard__textos">
          <h1 className="onboarding-wizard__titulo-app">
            Te damos la bienvenida a <span className="onboarding-wizard__nombre-app">mfinance</span>
          </h1>
          <p className="onboarding-wizard__subtitulo">Configura tu perfil en cinco pasos. Solo el primero es obligatorio.</p>
        </div>
      </header>

      <nav aria-label="Progreso del onboarding">
        <ol className="onboarding-wizard__pasos">
          {PASOS.map((p) => {
            const estado = p.id < currentStep ? 'hecho' : p.id === currentStep ? 'actual' : 'pendiente';
            return (
              <li key={p.id} className={`onboarding-wizard__paso onboarding-wizard__paso--${estado}`}
                aria-current={estado === 'actual' ? 'step' : undefined}>
                <span className="onboarding-wizard__paso-numero" aria-hidden="true">
                  {estado === 'hecho' ? <Icono nombre="check" tamano={14} /> : p.id}
                </span>
                <span className="onboarding-wizard__paso-titulo">{p.titulo}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="card onboarding-wizard__tarjeta" aria-labelledby="onboarding-paso-titulo">
        <header className="onboarding-wizard__cabecera">
          <p className="onboarding-wizard__eyebrow">
            Paso {info.id} de {PASOS.length}
            {info.opcional ? <span className="badge">Opcional</span> : null}
          </p>
          <h2 id="onboarding-paso-titulo" className="onboarding-wizard__titulo-paso">{info.titulo}</h2>
          <p className="onboarding-wizard__descripcion">{info.descripcion}</p>
        </header>

        <WizardContenido
          keyPaso={info.key}
          datos={datos} pasoActual={pasoActual} paso2Actual={paso2Actual}
          paso3Actual={paso3Actual} paso4Actual={paso4Actual}
          alCambiarPaso1={actualizarPaso1} alCambiarPaso2={actualizarPaso2}
          alCambiarPaso3={actualizarPaso3} alCambiarPaso4={actualizarPaso4}
          metas={metas} alCambiarMetas={setMetas} deshabilitado={operacionEnCurso}
          perfilId={perfilId}
        />

        <footer className="onboarding-wizard__navegacion">
          <button type="button" className="btn btn--fantasma" onClick={pasoAnterior}
            disabled={currentStep === 1 || operacionEnCurso}>
            <Icono nombre="anterior" tamano={16} /> Atrás
          </button>
          <div className="onboarding-wizard__acciones">
            {currentStep === 1 && (
              <button type="button" className="btn btn--fantasma" onClick={() => void manejarSaltar()}
                disabled={operacionEnCurso}>Saltar por ahora</button>
            )}
            <button type="button" className="btn btn--primario" onClick={() => void manejarSiguiente()}
              disabled={!pasoValido || operacionEnCurso}>
              {esUltimoPaso ? 'Finalizar' : <>Siguiente <Icono nombre="siguiente" tamano={16} /></>}
            </button>
          </div>
        </footer>
      </section>
      {guardando && <div className="onboarding-wizard__guardando" role="status">Guardando cambios…</div>}
    </div>
  );
}
