// Re-export de todos los casos de uso de onboarding (puro TS)
export { DEBOUNCE_MS, estadoInicialDatos, paso1PorDefecto, cargarEstadoOnboarding, type PuertosOnboarding } from './onboarding-estado.ts';
export { actualizarPaso1 } from './onboarding-paso1.ts';
export { actualizarPaso2 } from './onboarding-paso2.ts';
export { actualizarPaso3, paso3DataPorDefecto } from './onboarding-paso3.ts';
export { actualizarPaso4, cambiarUmbral, restaurarUmbralesDefecto, umbralesPorDefecto, validarUmbrales } from './onboarding-paso4.ts';
export { agregarMeta, actualizarMeta, eliminarMeta } from './gestionar-metas.ts';
export { construirResumenOnboarding } from './onboarding-resumen.ts';
export { completarOnboarding, saltarOnboarding } from './onboarding-paso5.ts';
