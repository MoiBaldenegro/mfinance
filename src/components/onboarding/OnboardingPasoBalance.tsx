// REQ-25-01/07/10: Paso 2 — Balance inicial. Tres acordeones (activos,
// pasivos, inversiones) y el patrimonio neto resultante.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import { ActivosSection } from './ActivosSection.tsx';
import { PasivosSection } from './PasivosSection.tsx';
import { InversionesSection } from './InversionesSection.tsx';
import type { Paso2Data } from '../../domain/entities/onboarding/index.ts';
import '../../styles/onboarding-paso-balance.css';

interface Props {
  readonly datos: Paso2Data | null;
  readonly alCambiar: (paso2: Paso2Data) => void;
  readonly moneda: Moneda;
  readonly deshabilitado: boolean;
}

const VACIO: Paso2Data = { activos: [], pasivos: [], inversiones: [] };

export function OnboardingPasoBalance({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const paso2 = datos ?? VACIO;
  const activos = paso2.activos.reduce((s, a) => s + a.valor_actual, 0);
  const pasivos = paso2.pasivos.reduce((s, p) => s + p.saldo_pendiente, 0);
  const patrimonio = activos - pasivos;

  return (
    <div className="onboarding-paso-balance">
      <ActivosSection datos={paso2} alCambiar={alCambiar} moneda={moneda} deshabilitado={deshabilitado} />
      <PasivosSection datos={paso2} alCambiar={alCambiar} moneda={moneda} deshabilitado={deshabilitado} />
      <InversionesSection datos={paso2} alCambiar={alCambiar} moneda={moneda} deshabilitado={deshabilitado} />
      <p className="onboarding-paso-balance__patrimonio" role="status">
        <span>Patrimonio neto inicial</span>
        <strong className={`num ${patrimonio < 0 ? 'negativo' : ''}`}>{formatoMoneda(patrimonio, moneda)}</strong>
      </p>
    </div>
  );
}
