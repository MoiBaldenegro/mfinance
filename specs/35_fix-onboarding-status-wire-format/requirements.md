# Requisitos — fix-onboarding-status-wire-format (feature 35)

REQ-35-01 El contrato JSON del estado de onboarding SHALL serializar cada estado como objeto con discriminador `nombre` y conservar `current_step` para `InProgress`, de forma compatible con la entidad TypeScript.
REQ-35-02 El backend SHALL deserializar la representación canónica con `nombre` y la representación serde externa anterior almacenada en perfiles existentes.
REQ-35-03 WHEN el gate recibe del command de carga un estado `Completed`, el SnapshotProvider SHALL clasificar la carga como `listo` para que AppShell reemplace al OnboardingWizard.
REQ-35-04 WHEN finalizar o saltar el onboarding responde correctamente, el flujo SHALL recargar el snapshot y mostrar AppShell con el snapshot persistido sin volver a montar el wizard en el paso 1.
REQ-35-05 Los tests del contrato SHALL verificar los tres estados canónicos, la lectura retrocompatible y la transición post-finalización y post-salto hacia AppShell.
