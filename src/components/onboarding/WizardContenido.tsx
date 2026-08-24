// REQ-24-04 + REQ-27-01/05: contenido del wizard según el paso activo.
// Extraído de OnboardingWizard para respetar la regla dura de ≤100 líneas.
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import type { OnboardingData, Paso1Data, Paso2Data, Paso3Data, Paso4Data } from '../../domain/entities/onboarding/index.ts';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import { OnboardingPaso1 } from './OnboardingPaso1.tsx';
import { OnboardingPasoBalance } from './OnboardingPasoBalance.tsx';
import { OnboardingPasoDeudaProyeccion } from './OnboardingPasoDeudaProyeccion.tsx';
import { OnboardingPasoMetas } from './OnboardingPasoMetas.tsx';
import { OnboardingPasoResumen } from './OnboardingPasoResumen.tsx';
import { OnboardingPasoPlaceholder } from './OnboardingPasoPlaceholder.tsx';
import '../../styles/onboarding-wizard.css';

export interface WizardContenidoProps {
  readonly keyPaso: string;
  readonly titulo: string;
  readonly pasoId: number;
  readonly datos: OnboardingData;
  readonly pasoActual: Paso1Data;
  readonly paso2Actual: Paso2Data;
  readonly paso3Actual: Paso3Data;
  readonly paso4Actual: Paso4Data;
  readonly alCambiarPaso1: (campo: keyof Paso1Data, valor: Paso1Data[keyof Paso1Data]) => void;
  readonly alCambiarPaso2: (paso2: Paso2Data) => void;
  readonly alCambiarPaso3: (paso3: Paso3Data) => void;
  readonly alCambiarPaso4: (paso4: Paso4Data) => void;
  readonly metas: readonly GoalEntry[];
  readonly alCambiarMetas: (metas: readonly GoalEntry[]) => void;
  readonly deshabilitado: boolean;
  readonly perfilId?: string;
  readonly alSaltar: () => void;
}

/** Renderiza el paso activo dentro del área central del wizard. */
export function WizardContenido(props: WizardContenidoProps) {
  const {
    keyPaso, titulo, pasoId, datos, pasoActual, paso2Actual, paso3Actual,
    paso4Actual, alCambiarPaso1, alCambiarPaso2, alCambiarPaso3,
    alCambiarPaso4, metas, alCambiarMetas, deshabilitado, perfilId, alSaltar,
  } = props;
  return (
    <main className="onboarding-wizard__contenido">
      {contenido({ keyPaso, titulo, pasoId, datos, pasoActual, paso2Actual, paso3Actual,
        paso4Actual, alCambiarPaso1, alCambiarPaso2, alCambiarPaso3,
        alCambiarPaso4, metas, alCambiarMetas, deshabilitado, perfilId, alSaltar })}
    </main>
  );
}

function contenido({
  keyPaso, titulo, pasoId, datos, pasoActual, paso2Actual, paso3Actual,
  paso4Actual, alCambiarPaso1, alCambiarPaso2, alCambiarPaso3,
  alCambiarPaso4, metas, alCambiarMetas, deshabilitado, perfilId, alSaltar,
}: WizardContenidoProps) {
  if (keyPaso === 'paso1') {
    return <OnboardingPaso1 datos={pasoActual} alCambiar={alCambiarPaso1} alSaltar={alSaltar} deshabilitado={deshabilitado} />;
  }
  if (keyPaso === 'paso2') {
    return <OnboardingPasoBalance datos={paso2Actual} alCambiar={alCambiarPaso2} deshabilitado={deshabilitado} />;
  }
  if (keyPaso === 'paso3') {
    return (
      <OnboardingPasoDeudaProyeccion
        datos={paso3Actual} alCambiar={alCambiarPaso3} deshabilitado={deshabilitado}
        snapshotPort={snapshotPort} paso1Data={pasoActual}
      />
    );
  }
  if (keyPaso === 'paso4') {
    return (
      <OnboardingPasoMetas
        datos={paso4Actual} alCambiar={alCambiarPaso4} deshabilitado={deshabilitado}
        perfilId={perfilId} metasIniciales={metas} alCambiarMetas={alCambiarMetas}
      />
    );
  }
  if (keyPaso === 'paso5') {
    return <OnboardingPasoResumen datos={datos} metas={metas} />;
  }
  return <OnboardingPasoPlaceholder titulo={titulo} paso={pasoId} />;
}
