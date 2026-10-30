// REQ-24-04 + REQ-27-01/05: contenido del wizard según el paso activo.
// Los pasos 2-3 formatean importes con la moneda elegida en el paso 1
// (el perfil todavía no la tiene hasta finalizar).
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import type { OnboardingData, Paso1Data, Paso2Data, Paso3Data, Paso4Data } from '../../domain/entities/onboarding/index.ts';
import { usarPuertos } from '../../app/puertos.ts';
import { OnboardingPaso1 } from './OnboardingPaso1.tsx';
import { OnboardingPasoBalance } from './OnboardingPasoBalance.tsx';
import { OnboardingPasoDeudaProyeccion } from './OnboardingPasoDeudaProyeccion.tsx';
import { OnboardingPasoMetas } from './OnboardingPasoMetas.tsx';
import { OnboardingPasoResumen } from './OnboardingPasoResumen.tsx';
import '../../styles/onboarding-wizard.css';

export interface WizardContenidoProps {
  readonly keyPaso: string;
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
}

/** Renderiza el paso activo dentro de la tarjeta del wizard. */
export function WizardContenido(props: WizardContenidoProps) {
  const { snapshot } = usarPuertos();
  const { keyPaso, pasoActual, deshabilitado } = props;
  const moneda = pasoActual.moneda;
  return (
    <div className="onboarding-wizard__contenido">
      {keyPaso === 'paso1' && (
        <OnboardingPaso1 datos={pasoActual} alCambiar={props.alCambiarPaso1} deshabilitado={deshabilitado} />
      )}
      {keyPaso === 'paso2' && (
        <OnboardingPasoBalance datos={props.paso2Actual} alCambiar={props.alCambiarPaso2}
          moneda={moneda} deshabilitado={deshabilitado} />
      )}
      {keyPaso === 'paso3' && (
        <OnboardingPasoDeudaProyeccion datos={props.paso3Actual} alCambiar={props.alCambiarPaso3}
          deshabilitado={deshabilitado} snapshotPort={snapshot} paso1Data={pasoActual} moneda={moneda} />
      )}
      {keyPaso === 'paso4' && (
        <OnboardingPasoMetas datos={props.paso4Actual} alCambiar={props.alCambiarPaso4}
          deshabilitado={deshabilitado} perfilId={props.perfilId}
          metasIniciales={props.metas} alCambiarMetas={props.alCambiarMetas} />
      )}
      {keyPaso === 'paso5' && <OnboardingPasoResumen datos={props.datos} metas={props.metas} />}
    </div>
  );
}
