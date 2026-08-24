// REQ-27-05: Paso 5 — resumen completo del onboarding con checks y
// totales. Las secciones las construye construirResumenOnboarding
// (caso de uso puro); «Finalizar onboarding» lo maneja la barra inferior.
import { useMemo } from 'react';
import type { OnboardingData } from '../../domain/entities/onboarding/index.ts';
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import { construirResumenOnboarding } from '../../domain/use-cases/onboarding/onboarding-resumen.ts';
import '../../styles/onboarding-paso-resumen.css';

interface Props {
  readonly datos: OnboardingData;
  readonly metas: readonly GoalEntry[];
}

/** Resumen de todo lo capturado en los pasos anteriores. */
export function OnboardingPasoResumen({ datos, metas }: Props) {
  const secciones = useMemo(() => construirResumenOnboarding(datos, metas), [datos, metas]);
  return (
    <section className="onboarding-paso-resumen">
      <h3 className="onboarding-paso-resumen__titulo">Resumen de tu onboarding</h3>
      <p className="onboarding-paso-resumen__ayuda">
        Revisa todo lo capturado. Al finalizar se consolidará en tu perfil.
      </p>
      <ul className="onboarding-paso-resumen__lista">
        {secciones.map((seccion) => (
          <li key={seccion.id} className={`resumen-seccion ${seccion.completo ? 'resumen-seccion--completo' : 'resumen-seccion--incompleto'}`}>
            <span className="resumen-seccion__check" aria-hidden="true">{seccion.completo ? '✓' : '○'}</span>
            <div className="resumen-seccion__cuerpo">
              <span className="resumen-seccion__titulo">{seccion.titulo}</span>
              {seccion.lineas.map((linea) => (
                <span key={linea} className="resumen-seccion__linea">{linea}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {metas.length > 0 && (
        <p className="onboarding-paso-resumen__metas">
          Tus metas: {metas.map((m) => m.titulo).join(' · ')}
        </p>
      )}
    </section>
  );
}
