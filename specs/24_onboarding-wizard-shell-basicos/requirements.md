# Requisitos — onboarding-wizard-shell-basicos (feature 24)

REQ-24-01 El sistema SHALL definir puerto OnboardingPort en domain/ports/onboarding-port.ts con métodos obtenerEstado, actualizarDatos, completarOnboarding, obtenerDatosParciales.
REQ-24-02 El sistema SHALL implementar OnboardingAdapter en adapters/onboarding-adapter.ts usando invoke() para commands backend obtener_onboarding_status, actualizar_perfil_onboarding, completar_onboarding; invoke SOLO en este adapter (grep 0 en components/domain).
REQ-24-03 El sistema SHALL crear caso de uso gestionarOnboarding en domain/use-cases/onboarding/gestionar-onboarding.ts que orqueste obtener estado, actualizar datos parciales, completar onboarding usando OnboardingPort.
REQ-24-04 El sistema SHALL crear componente OnboardingWizard.tsx que renderice barra progreso 5 pasos, botones Atrás/Siguiente/Finalizar, contenedor paso activo, navegación controlada (no avanzar si paso inválido).
REQ-24-05 El sistema SHALL guardar automáticamente datos del paso actual vía actualizarDatos con debounce 500ms al modificar campo o cambiar paso permitiendo reanudar onboarding tras cerrar app.
REQ-24-06 El sistema SHALL renderizar en paso 1: campo nombre completo requerido, selector moneda MXN/USD/EUR default MXN (reusa catálogo moneda.ts), botón Saltar onboarding que crea perfil mínimo y navega a app.
REQ-24-07 El sistema SHALL renderizar en paso 1 lista fuentes ingreso (salario, freelance, arriendos, otros) con checkboxes; requerir ≥1 activa para avanzar.
REQ-24-08 El sistema SHALL renderizar en paso 1 lista categorías gasto (vivienda, alimentacion, transporte, cuotas_deuda, ocio, otros) con checkboxes; requerir ≥1 activa para avanzar.
REQ-24-09 El sistema SHALL bloquear botón Siguiente paso 1 SI nombre vacío, ninguna fuente ingreso activa, o ninguna categoría gasto activa; mostrar mensaje en español junto al campo/grupo.
REQ-24-10 El sistema SHALL modificar Ajustes (feature 22) para que Crear perfil lance OnboardingWizard; si completa → perfil onboarding=Completed; si Salta → perfil mínimo (nombre, MXN, Completed).
REQ-24-11 El sistema SHALL al seleccionar perfil con onboarding_status=InProgress en Ajustes mostrar botón Reanudar onboarding que abre wizard en current_step guardado con datos parciales cargados.
REQ-24-12 El sistema SHALL usar exclusivamente custom properties de tokens.css en hojas nuevas/modificadas; audit-design-tokens OK; sin colores/espaciados/radios/sombras hardcodeados.
REQ-24-13 El sistema SHALL incluir tests node:test TDD rojo→verde para: caso uso gestionarOnboarding con puerto falso (verifica actualizarDatos, completarOnboarding, obtenerEstado), componente OnboardingWizard render/validación/navegación, persistencia parcial.
REQ-24-14 El sistema SHALL garantizar domain/ sin react/@tauri-apps/api; invoke solo en adapters/; componentes delegan en casos uso; ≤100 líneas/archivo (wc -l).