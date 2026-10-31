// REQ-26-01/07/10: Paso 3 — estrategia de deuda, supuestos de proyección y
// vista previa a 12 meses (solo lectura, recalculada al cambiar supuestos).
import { useEffect, useMemo, useState } from 'react';
import { clavesIngresos, clavesGastos, etiquetaIngreso, etiquetaGasto } from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import { DeudaSection } from './DeudaSection.tsx';
import { ProyeccionSection } from './ProyeccionSection.tsx';
import type { VariableProyeccion } from './ProyeccionSection.tsx';
import { PreviewSection } from './PreviewSection.tsx';
import type { Paso3Data } from '../../domain/entities/onboarding/index.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import type { ProyeccionPyg, BalanceFuturo } from '../../domain/entities/pyg-proyeccion.ts';
import type { SnapshotPort } from '../../domain/ports/snapshot-port.ts';
import '../../styles/onboarding-paso-deuda-proyeccion.css';

interface Props {
  readonly datos: Paso3Data | null;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly deshabilitado: boolean;
  readonly snapshotPort: SnapshotPort;
  readonly paso1Data: { fuentes_ingreso_activas: readonly string[]; categorias_gasto_usadas: readonly string[] } | null;
  readonly moneda: Moneda;
}

const POR_DEFECTO: Paso3Data = { estrategia_deuda: 'Avalanche', pago_extra_mensual: 0, supuestos_proyeccion: [] };

export function OnboardingPasoDeudaProyeccion({ datos, alCambiar, deshabilitado, snapshotPort, paso1Data, moneda }: Props) {
  const paso3 = datos ?? POR_DEFECTO;
  const variables = useMemo<readonly VariableProyeccion[]>(() => [
    ...(paso1Data?.fuentes_ingreso_activas ?? []).map((k) => ({ id: k, etiqueta: etiquetaIngreso(k), tipo: 'ingreso' as const })),
    ...(paso1Data?.categorias_gasto_usadas ?? []).map((k) => ({ id: k, etiqueta: etiquetaGasto(k), tipo: 'gasto' as const })),
    { id: 'revalorizacion_activos', etiqueta: 'Revalorización de activos (anual)', tipo: 'balance' as const },
    { id: 'interes_pasivos', etiqueta: 'Interés de pasivos (anual)', tipo: 'balance' as const },
  ], [paso1Data]);

  const [proyeccionPyg, setProyeccionPyg] = useState<ProyeccionPyg | null>(null);
  const [balanceFuturo, setBalanceFuturo] = useState<BalanceFuturo | null>(null);
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    let montado = true;
    const sup = { variacionIngresos: {} as Record<string, number>, variacionGastos: {} as Record<string, number> };
    for (const s of paso3.supuestos_proyeccion) {
      if (clavesIngresos().includes(s.variable)) sup.variacionIngresos[s.variable] = s.porcentaje;
      else if (clavesGastos().includes(s.variable)) sup.variacionGastos[s.variable] = s.porcentaje;
    }
    setCargando(true);
    Promise.all([snapshotPort.pygProyeccion(sup), snapshotPort.balanceFuturo(sup)])
      .then(([pyg, balance]) => { if (montado) { setProyeccionPyg(pyg); setBalanceFuturo(balance); } })
      .catch(() => { if (montado) { setProyeccionPyg(null); setBalanceFuturo(null); } })
      .finally(() => { if (montado) setCargando(false); });
    return () => { montado = false; };
  }, [paso3.supuestos_proyeccion, snapshotPort]);

  return (
    <div className="onboarding-paso-deuda-proyeccion">
      <DeudaSection paso3={paso3} alCambiar={alCambiar} moneda={moneda} deshabilitado={deshabilitado} />
      <ProyeccionSection paso3={paso3} alCambiar={alCambiar} variables={variables} deshabilitado={deshabilitado} />
      <PreviewSection proyeccionPyg={proyeccionPyg} balanceFuturo={balanceFuturo} moneda={moneda} cargando={cargando} />
    </div>
  );
}
