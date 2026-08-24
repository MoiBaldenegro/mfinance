// REQ-27-01: Paso 4 del wizard — Umbrales de indicadores + Metas Journal.
// Compone las dos secciones; toda la lógica vive en casos de uso.
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import type { Paso4Data } from '../../domain/entities/onboarding/index.ts';
import { IndicadoresUmbralesSection } from './IndicadoresUmbralesSection.tsx';
import { MetasJournalSection } from './MetasJournalSection.tsx';
import '../../styles/onboarding-paso-metas.css';

interface Props {
  readonly datos: Paso4Data;
  readonly alCambiar: (paso4: Paso4Data) => void;
  readonly deshabilitado: boolean;
  /** Perfil sobre el que persistir el journal (wizard desde Ajustes). */
  readonly perfilId?: string;
  readonly metasIniciales?: readonly GoalEntry[];
  readonly alCambiarMetas?: (metas: readonly GoalEntry[]) => void;
}

/** Paso opcional: umbrales personalizados + journal libre de metas. */
export function OnboardingPasoMetas({
  datos, alCambiar, deshabilitado, perfilId, metasIniciales, alCambiarMetas,
}: Props) {
  return (
    <section className="onboarding-paso-metas">
      <h3 className="onboarding-paso-metas__titulo">Paso 4: Umbrales y metas (opcional)</h3>
      <p className="onboarding-paso-metas__ayuda">
        Ajusta los semáforos a tu criterio y anota tus metas. Puedes continuar sin cambiar nada.
      </p>
      <div className="onboarding-paso-metas__secciones">
        <IndicadoresUmbralesSection paso4={datos} alCambiar={alCambiar} deshabilitado={deshabilitado} />
        <MetasJournalSection
          perfilId={perfilId}
          metasIniciales={metasIniciales}
          alCambiar={alCambiarMetas}
          deshabilitado={deshabilitado}
        />
      </div>
    </section>
  );
}
