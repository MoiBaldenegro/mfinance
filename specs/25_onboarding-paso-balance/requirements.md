# Requisitos — onboarding-paso-balance (feature 25)

REQ-25-01 El sistema SHALL crear componente OnboardingPasoBalance.tsx con tres secciones colapsables: Activos, Pasivos, Inversiones.
REQ-25-02 El sistema SHALL permitir en sección Activos: añadir (nombre, categoría líquido/inversión/propiedad, valor>0), listar, editar, eliminar; validar valor>0 con mensaje error en español.
REQ-25-03 El sistema SHALL permitir en sección Pasivos: añadir (nombre, saldo>0, tasa 0-30%), listar, editar, eliminar; validar saldo>0 y tasa≥0≤30% con mensaje en español.
REQ-25-04 El sistema SHALL renderizar en sección Inversiones tres familias (renta_fija, renta_variable, finca_raiz) con campos aporte mensual, valor actual, tasa esperada 0-30%; validar tasa 0-30% con mensaje en español.
REQ-25-05 El sistema SHALL reutilizar casos uso y validaciones features 8 y 11 (patrimonio = suma activos - suma pasivos, validación tasas, estructura datos) SIN duplicar lógica.
REQ-25-06 El sistema SHALL al modificar cualquier campo paso 2 actualizar onboarding_data.balance (activos, pasivos, inversiones) en backend vía actualizarDatos con debounce 500ms o al cambiar paso.
REQ-25-07 El sistema SHALL permitir avanzar a paso 3 SIN datos obligatorios (usuario puede tener 0 activos/pasivos/inversiones); botón Siguiente siempre habilitado en este paso.
REQ-25-08 El sistema SHALL usar formatoMoneda del núcleo (features 19/20) para mostrar valores con moneda del perfil activo (símbolo, separadores, posición MXN/USD/EUR).
REQ-25-09 El sistema SHALL incluir tests node:test TDD rojo→verde para: caso uso validación/guardado balance en onboarding_data, componente render 3 secciones, CRUD actualiza onboarding_data, validaciones valor>0 tasa 0-30%, formateo según moneda.
REQ-25-10 El sistema SHALL colocar componente en components/onboarding/, estilos en styles/, caso uso en domain/use-cases/onboarding/, puerto en domain/ports/; domain sin react/@tauri-apps/api; invoke solo en adapter; ≤100 líneas/archivo; audit-design-tokens OK.