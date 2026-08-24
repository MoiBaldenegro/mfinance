// Doble del puerto de onboarding para las suites node de F24.
// Espejo de la forma que cruza el IPC (OnboardingStatus, OnboardingData, Paso1Data).

export function onboardingDataFalso(overrides = {}) {
  return {
    paso1: overrides.paso1 ?? null,
    paso2: overrides.paso2 ?? null,
    paso3: overrides.paso3 ?? null,
    paso4: overrides.paso4 ?? null,
  };
}

export function paso1DataFalso(overrides = {}) {
  return {
    nombre_completo: overrides.nombre_completo ?? 'Juan Pérez',
    moneda: overrides.moneda ?? 'MXN',
    fuentes_ingreso_activas: overrides.fuentes_ingreso_activas ?? ['salario'],
    categorias_gasto_usadas: overrides.categorias_gasto_usadas ?? ['vivienda', 'alimentacion'],
  };
}

export function onboardingStatusNotStarted() {
  return { nombre: 'NotStarted' };
}

export function onboardingStatusInProgress(current_step = 1) {
  return { nombre: 'InProgress', current_step };
}

export function onboardingStatusCompleted() {
  return { nombre: 'Completed' };
}

export function perfilFalso(nombre, id = `p_${nombre.toLowerCase()}`) {
  return { id, nombre, creado_en: '2026-08-23T12:00:00Z' };
}

export function puertoOnboardingFalso() {
  const estado = { status: onboardingStatusNotStarted(), data: onboardingDataFalso() };
  const llamadas = { obtenerEstado: 0, actualizarDatos: 0, completarOnboarding: 0, obtenerDatosParciales: 0 };
  const adapter = {
    obtenerEstado: async () => {
      llamadas.obtenerEstado++;
      return estado.status;
    },
    actualizarDatos: async (datos) => {
      llamadas.actualizarDatos++;
      estado.data = datos;
    },
    completarOnboarding: async () => {
      llamadas.completarOnboarding++;
      estado.status = onboardingStatusCompleted();
      return perfilFalso('Juan Pérez');
    },
    obtenerDatosParciales: async () => {
      llamadas.obtenerDatosParciales++;
      return estado.data;
    },
  };
  // Exponer estado y llamadas para que los tests puedan inspeccionarlos
  return { onboarding: adapter, estado, llamadas };
}

export function puertoOnboardingConError(error) {
  const adapter = {
    obtenerEstado: async () => { throw error; },
    actualizarDatos: async () => { throw error; },
    completarOnboarding: async () => { throw error; },
    obtenerDatosParciales: async () => { throw error; },
  };
  return { onboarding: adapter };
}

export const AVISO_NOMBRE_VACIO = 'el nombre es obligatorio';
export const AVISO_FUENTES_VACIAS = 'selecciona al menos una fuente de ingreso';
export const AVISO_CATEGORIAS_VACIAS = 'selecciona al menos una categoría de gasto';
export const AVISO_SALTAR_EXITO = 'Perfil creado sin onboarding';
export const AVISO_CARGA_FALLIDA = 'no se pudo cargar el estado del onboarding';
export const AVISO_GUARDADO_FALLIDO = 'no se pudo guardar el progreso del onboarding';
export const AVISO_COMPLETAR_FALLIDO = 'no se pudo completar el onboarding';

export function avisoNombreVacio() { return AVISO_NOMBRE_VACIO; }
export function avisoFuentesVacias() { return AVISO_FUENTES_VACIAS; }
export function avisoCategoriasVacias() { return AVISO_CATEGORIAS_VACIAS; }
export function avisoSaltarExito() { return AVISO_SALTAR_EXITO; }
export function avisoCargaFallida() { return AVISO_CARGA_FALLIDA; }
export function avisoGuardadoFallido() { return AVISO_GUARDADO_FALLIDO; }
export function avisoCompletarFallido() { return AVISO_COMPLETAR_FALLIDO; }