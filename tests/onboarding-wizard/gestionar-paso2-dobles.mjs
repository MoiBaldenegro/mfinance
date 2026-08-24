// Dobles y helpers compartidos para tests de onboarding paso 2
export function puertoOnboardingFalso() {
  const estado = { datos: null };
  const llamadas = { actualizarDatos: 0 };
  const adapter = {
    actualizarDatos: async (datos) => {
      llamadas.actualizarDatos++;
      estado.datos = datos;
    },
  };
  return { onboarding: adapter, estado, llamadas };
}

export function puertoOnboardingConError() {
  const adapter = {
    actualizarDatos: async () => { throw new Error('IPC falló'); },
  };
  return { onboarding: adapter };
}

export function paso2DataVacio() {
  return { activos: [], pasivos: [], inversiones: [] };
}

export function onboardingDataVacio() {
  return { paso1: null, paso2: null, paso3: null, paso4: null };
}

export function activoValido(overrides = {}) {
  return { nombre: 'Efectivo', categoria: 'liquido', valor_actual: 1000, ...overrides };
}

export function pasivoValido(overrides = {}) {
  return { nombre: 'Hipoteca', saldo_pendiente: 100000, tasa_interes_anual: 3.5, ...overrides };
}

export function inversionValida(overrides = {}) {
  return { familia: 'renta_fija', aporte_mensual: 100, valor_actual: 5000, tasa_esperada_anual: 5, ...overrides };
}