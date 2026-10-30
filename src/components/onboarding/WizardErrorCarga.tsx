// Vista de error de carga del wizard con botón Reintentar.
import '../../styles/onboarding-wizard.css';

interface WizardErrorCargaProps {
  readonly mensaje: string;
  readonly alReintentar: () => void;
}

/** Estado de error al cargar el onboarding guardado, con botón Reintentar. */
export function WizardErrorCarga({ mensaje, alReintentar }: WizardErrorCargaProps) {
  return (
    <div className="onboarding-wizard">
      <div className="aviso aviso--error onboarding-wizard--error" role="alert">
        <strong>No se pudo cargar tu onboarding</strong>
        <p>{mensaje}</p>
        <button type="button" className="btn btn--sm" onClick={alReintentar}>Reintentar</button>
      </div>
    </div>
  );
}
