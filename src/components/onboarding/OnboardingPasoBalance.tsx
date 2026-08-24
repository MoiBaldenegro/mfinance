// REQ-25-01/07/10: Padre del Paso 2 - Balance inicial (≤100 líneas)
import { useMemo, useCallback } from 'react';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { ActivosSection } from './ActivosSection.tsx';
import { PasivosSection } from './PasivosSection.tsx';
import { InversionesSection } from './InversionesSection.tsx';
import type { Paso2Data } from '../../domain/entities/onboarding/index.ts';
import '../../styles/onboarding-paso-balance.css';

interface Props {
  readonly datos: Paso2Data | null;
  readonly alCambiar: (paso2: Paso2Data) => void;
  readonly deshabilitado: boolean;
}

export function OnboardingPasoBalance({ datos, alCambiar, deshabilitado }: Props) {
  const moneda = usarMoneda();

  const paso2 = useMemo(() => datos ?? { activos: [], pasivos: [], inversiones: [] }, [datos]);

  const manejarCambio = useCallback((nuevos: Paso2Data) => {
    alCambiar(nuevos);
  }, [alCambiar]);

  const hayDatos = useMemo(
    () => paso2.activos.length > 0 || paso2.pasivos.length > 0 || paso2.inversiones.length > 0,
    [paso2],
  );

  return (
    <section className="onboarding-paso-balance">
      <h3 className="onboarding-paso-balance__titulo">Paso 2: Balance inicial (opcional)</h3>
      <p className="onboarding-paso-balance__ayuda">
        Registra tus activos, pasivos e inversiones actuales. Puedes saltar este paso y completarlo después.
      </p>

      <ActivosSection datos={paso2} alCambiar={manejarCambio} moneda={moneda} deshabilitado={deshabilitado} />
      <PasivosSection datos={paso2} alCambiar={manejarCambio} moneda={moneda} deshabilitado={deshabilitado} />
      <InversionesSection datos={paso2} alCambiar={manejarCambio} moneda={moneda} deshabilitado={deshabilitado} />

      {!hayDatos && (
        <div className="onboarding-paso-balance__vacio-global" role="status">
          <p>No hay datos de balance registrados. El resumen aparecerá aquí al añadir elementos.</p>
        </div>
      )}
    </section>
  );
}