// REQ-26-01/07/10: Padre Paso 3 — Deuda y proyección (≤100 líneas)
import { useEffect, useMemo, useState } from 'react';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { clavesIngresos, clavesGastos, etiquetaIngreso, etiquetaGasto } from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import { DeudaSection } from './DeudaSection.tsx';
import { ProyeccionSection } from './ProyeccionSection.tsx';
import { PreviewSection } from './PreviewSection.tsx';
import type { Paso3Data } from '../../domain/entities/onboarding/index.ts';
import type { ProyeccionPyg, BalanceFuturo } from '../../domain/entities/pyg-proyeccion.ts';
import type { SnapshotPort } from '../../domain/ports/snapshot-port.ts';
import '../../styles/onboarding-paso-deuda-proyeccion.css';

interface Props {
  readonly datos: Paso3Data | null;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly deshabilitado: boolean;
  readonly snapshotPort: SnapshotPort;
  readonly paso1Data: { fuentes_ingreso_activas: readonly string[]; categorias_gasto_usadas: readonly string[] } | null;
}

export function OnboardingPasoDeudaProyeccion({ datos, alCambiar, deshabilitado, snapshotPort, paso1Data }: Props) {
  const moneda = usarMoneda();
  const paso3 = useMemo(() => datos ?? ({ estrategia_deuda: 'Avalanche' as const, pago_extra_mensual: 0, supuestos_proyeccion: [] as const }), [datos]);
  const variables = useMemo(() => {
    const vars: { id: string; etiqueta: string; tipo: 'ingreso' | 'gasto' | 'balance' }[] = [];
    paso1Data?.fuentes_ingreso_activas?.forEach((k) => vars.push({ id: k, etiqueta: `Ingreso: ${etiquetaIngreso(k)}`, tipo: 'ingreso' }));
    paso1Data?.categorias_gasto_usadas?.forEach((k) => vars.push({ id: k, etiqueta: `Gasto: ${etiquetaGasto(k)}`, tipo: 'gasto' }));
    vars.push({ id: 'revalorizacion_activos', etiqueta: 'Revalorización activos (% anual)', tipo: 'balance' });
    vars.push({ id: 'interes_pasivos', etiqueta: 'Interés pasivos (% anual)', tipo: 'balance' });
    return vars;
  }, [paso1Data]);
  const [proyeccionPyg, setProyeccionPyg] = useState<ProyeccionPyg | null>(null);
  const [balanceFuturo, setBalanceFuturo] = useState<BalanceFuturo | null>(null);
  const [cargando, setCargando] = useState(false);
  useEffect(() => {
    let montado = true;
    async function cargar() {
      setCargando(true);
      try {
        const sup = { variacionIngresos: {}, variacionGastos: {} } as { variacionIngresos: Record<string, number>; variacionGastos: Record<string, number> };
        paso3.supuestos_proyeccion.forEach((s) => { if (clavesIngresos().includes(s.variable)) sup.variacionIngresos[s.variable] = s.porcentaje; else if (clavesGastos().includes(s.variable)) sup.variacionGastos[s.variable] = s.porcentaje; });
        const [pyg, balance] = await Promise.all([snapshotPort.pygProyeccion(sup), snapshotPort.balanceFuturo(sup)]);
        if (montado) { setProyeccionPyg(pyg); setBalanceFuturo(balance); }
      } catch { if (montado) { setProyeccionPyg(null); setBalanceFuturo(null); } }
      finally { if (montado) setCargando(false); }
    }
    cargar();
    return () => { montado = false; };
  }, [paso3.supuestos_proyeccion, snapshotPort]);
  const hayDatos = paso3.estrategia_deuda || paso3.pago_extra_mensual > 0 || paso3.supuestos_proyeccion.length > 0;
  return (
    <section className="onboarding-paso-deuda-proyeccion">
      <h3 className="onboarding-paso-deuda-proyeccion__titulo">Paso 3: Deuda y proyección (opcional)</h3>
      <p className="onboarding-paso-deuda-proyeccion__ayuda">Define tu estrategia de deuda y supuestos de proyección a 12 meses. Puedes saltar este paso.</p>
      <DeudaSection paso3={paso3} alCambiar={alCambiar} moneda={moneda} deshabilitado={deshabilitado} />
      <ProyeccionSection paso3={paso3} alCambiar={alCambiar} variables={variables} deshabilitado={deshabilitado} />
      <PreviewSection proyeccionPyg={proyeccionPyg} balanceFuturo={balanceFuturo} moneda={moneda} cargando={cargando} />
      {!hayDatos && <div className="onboarding-paso-deuda-proyeccion__vacio-global" role="status"><p>No hay datos de deuda ni proyección configurados. La vista previa aparecerá al añadir supuestos o al tener histórico.</p></div>}
    </section>
  );
}