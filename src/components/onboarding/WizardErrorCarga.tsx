// Ronda 2 fix transversal feature 26: vista de error de carga del wizard,
// extraída de OnboardingWizard.tsx (regla dura ≤100 líneas por archivo).
// Reutiliza las clases BEM de la hoja onboarding-wizard.css; sin estilos
// propios ni embebidos.
import '../../styles/onboarding-wizard.css';

interface WizardErrorCargaProps {
  readonly mensaje: string;
  readonly alReintentar: () => void;
}

/** Estado de error al cargar el onboarding guardado, con botón Reintentar. */
export function WizardErrorCarga({ mensaje, alReintentar }: WizardErrorCargaProps) {
  return (
    <div className="onboarding-wizard onboarding-wizard--error" role="alert">
      <p className="onboarding-wizard__error">{mensaje}</p>
      <button className="onboarding-wizard__reintentar" onClick={alReintentar}>Reintentar</button>
    </div>
  );
}
