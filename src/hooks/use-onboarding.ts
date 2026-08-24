// REQ-24-05/25-06/26-08/27-02 + F33: hook React delgado para onboarding — delega en
// use-cases de dominio. La semántica de ocupación vive en el módulo puro
// onboarding-ocupacion: editar jamás ocupa; guardando es true solo mientras el IPC
// de persistencia parcial está en vuelo (REQ-33-01..06).
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { OnboardingData, OnboardingStatus, Paso1Data, Paso2Data, Paso3Data, Paso4Data } from '../domain/entities/onboarding/index.ts';
import { onboardingPort } from '../adapters/onboarding-adapter.ts';
import { gestionarOnboarding } from '../domain/use-cases/onboarding/gestionar-onboarding.ts';
import { DEBOUNCE_MS, estadoInicialDatos, paso1PorDefecto, paso3DataPorDefecto, cargarEstadoOnboarding, actualizarPaso1, actualizarPaso2, actualizarPaso3, actualizarPaso4, umbralesPorDefecto, completarOnboarding, saltarOnboarding, type PuertosOnboarding } from '../domain/use-cases/onboarding/index.ts';
import { crearOcupacionOnboarding, type GestionOcupacion } from '../domain/use-cases/onboarding/onboarding-ocupacion.ts';

const puertos: PuertosOnboarding = { onboarding: onboardingPort };

export interface UseOnboardingOptions { readonly datosIniciales?: OnboardingData; readonly pasoInicial?: number; readonly perfilId?: string; }

export interface UseOnboardingReturn {
  readonly status: OnboardingStatus; readonly datos: OnboardingData; readonly currentStep: number;
  readonly pasoActual: Paso1Data; readonly paso2Actual: Paso2Data;
  readonly paso3Actual: Paso3Data; readonly paso4Actual: Paso4Data;
  // guardando: SOLO persistencia parcial en vuelo (toast). operacionEnCurso: bloqueante.
  readonly guardando: boolean; readonly operacionEnCurso: boolean; readonly errorCarga: string | null;
  readonly siguientePaso: () => void; readonly pasoAnterior: () => void;
  readonly actualizarPaso1: (campo: keyof Paso1Data, valor: Paso1Data[keyof Paso1Data]) => void;
  readonly actualizarPaso2: (paso2: Paso2Data) => void; readonly actualizarPaso3: (paso3: Paso3Data) => void; readonly actualizarPaso4: (paso4: Paso4Data) => void;
  readonly completar: () => Promise<{ ok: boolean; nombre?: string; aviso?: string }>;
  readonly saltar: () => Promise<{ ok: boolean; aviso?: string }>;
  readonly recargar: () => void;
}

export function useOnboarding(opciones: UseOnboardingOptions = {}): UseOnboardingReturn {
  const { datosIniciales, pasoInicial = 1, perfilId } = opciones;
  const [status, setStatus] = useState<OnboardingStatus>({ nombre: 'NotStarted' });
  const [datos, setDatos] = useState<OnboardingData>(datosIniciales ?? estadoInicialDatos());
  const [guardando, setGuardando] = useState(false);
  const [operacionEnCurso, setOperacionEnCurso] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const montadoRef = useRef(true);
  const perfilRef = useRef(perfilId); perfilRef.current = perfilId;
  const ocupacionRef = useRef<GestionOcupacion<OnboardingData> | null>(null);
  if (!ocupacionRef.current) ocupacionRef.current = crearOcupacionOnboarding<OnboardingData>(DEBOUNCE_MS, async (nuevos) => {
    const r = await gestionarOnboarding.actualizarDatos(puertos, nuevos, perfilRef.current);
    if (!r.ok) throw new Error(r.aviso); // REQ-33-05: la máquina registra el fallo
  });
  const ocupacion = ocupacionRef.current;
  const cargarEstado = useCallback(async () => {
    try { const r = await cargarEstadoOnboarding(puertos, datosIniciales, pasoInicial, perfilId); if (montadoRef.current) setStatus(r); }
    catch (e) { if (montadoRef.current) { setErrorCarga(String(e)); setStatus({ nombre: 'NotStarted' }); } }
  }, [datosIniciales, pasoInicial, perfilId]);
  useEffect(() => {
    montadoRef.current = true;
    const baja = ocupacion.alCambiar((e) => { if (montadoRef.current) setGuardando(e.ocupado); });
    cargarEstado();
    return () => { montadoRef.current = false; baja(); ocupacion.cancelar(); };
  }, [cargarEstado, ocupacion]);

  const currentStep = status.nombre === 'InProgress' ? status.current_step : 1;
  const pasoActual = datos.paso1 ?? paso1PorDefecto();
  const paso2Actual = datos.paso2 ?? { activos: [], pasivos: [], inversiones: [] };
  const paso3Actual = useMemo(() => datos.paso3 ?? paso3DataPorDefecto(), [datos.paso3]);
  const paso4Actual = useMemo(() => datos.paso4 ?? { umbrales: umbralesPorDefecto() }, [datos.paso4]);

  // REQ-33-01: editar actualiza el estado local sin activar ocupación.
  const aplicar = useCallback((nuevos: OnboardingData) => {
    setDatos(nuevos); ocupacion.editar(nuevos);
  }, [ocupacion]);
  const act1 = useCallback((c: keyof Paso1Data, v: Paso1Data[keyof Paso1Data]) =>
    aplicar(actualizarPaso1(pasoActual, datos, c, v)), [pasoActual, datos, aplicar]);
  const act2 = useCallback((p: Paso2Data) => aplicar(actualizarPaso2(datos, p)), [datos, aplicar]);
  const act3 = useCallback((p: Paso3Data) => aplicar(actualizarPaso3(datos, p)), [datos, aplicar]);
  const act4 = useCallback((p: Paso4Data) => aplicar(actualizarPaso4(datos, p)), [datos, aplicar]);

  const sig = useCallback(async () => {
    if (currentStep < 5) { setStatus({ nombre: 'InProgress', current_step: currentStep + 1 }); try { await ocupacion.flush(); } finally { ocupacion.restablecer(); } }
  }, [currentStep, ocupacion]);
  const ant = useCallback(() => { if (currentStep > 1) setStatus({ nombre: 'InProgress', current_step: currentStep - 1 }); }, [currentStep]);
  const comp = useCallback(async () => {
    setOperacionEnCurso(true); try {
      await ocupacion.flush();
      const r = await completarOnboarding(puertos, perfilId);
      if (r.ok) setStatus({ nombre: 'Completed' });
      return r.ok ? { ok: true as const, nombre: r.perfil.nombre } : { ok: false as const, aviso: r.aviso };
    } finally { ocupacion.restablecer(); setOperacionEnCurso(false); }
  }, [ocupacion, perfilId]);
  const salt = useCallback(async () => {
    setOperacionEnCurso(true); try {
      await ocupacion.flush();
      const r = await saltarOnboarding(puertos, pasoActual, perfilId);
      if (r.ok) setStatus({ nombre: 'Completed' });
      return r.ok ? { ok: true as const } : { ok: false as const, aviso: r.aviso };
    } finally { ocupacion.restablecer(); setOperacionEnCurso(false); }
  }, [pasoActual, ocupacion, perfilId]);
  const rec = useCallback(() => { cargarEstado(); }, [cargarEstado]);

  return {
    status, datos, currentStep, pasoActual, paso2Actual, paso3Actual, paso4Actual,
    guardando, operacionEnCurso, errorCarga, siguientePaso: sig, pasoAnterior: ant,
    actualizarPaso1: act1, actualizarPaso2: act2, actualizarPaso3: act3, actualizarPaso4: act4,
    completar: comp, saltar: salt, recargar: rec,
  };
}
