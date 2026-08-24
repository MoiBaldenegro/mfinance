// REQ-24-04: Placeholder para pasos 2-5 del wizard (features 25-27).
import '../../styles/onboarding-paso-placeholder.css';

interface Props {
  readonly titulo: string;
  readonly paso: number;
}

export function OnboardingPasoPlaceholder({ titulo, paso }: Props) {
  return (
    <section className="onboarding-paso-placeholder">
      <h3 className="onboarding-paso-placeholder__titulo">{titulo}</h3>
      <p className="onboarding-paso-placeholder__texto">
        Paso {paso} — implementación pendiente (features 25-27)
      </p>
    </section>
  );
}