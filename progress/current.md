# Progreso actual

> Estado de la sesión actual. Mientras trabajas, documenta aquí lo que haces.

### Feature en curso

Feature en curso: 35 — fix-onboarding-status-wire-format

### Plan

- Fijar con tests Rust el JSON canónico y la lectura de los tres formatos legacy.
- Añadir contrato Node para gate, recarga post-finalización y recarga post-salto.
- Implementar el serde compatible sin tocar UI ni introducir dependencias.
- Ejecutar cargo test, pnpm test e init.sh y documentar rojo/verde.

### Bitácora

- 2026-08-24: init.sh validó el entorno, el backlog existente y la suite; se inició la investigación del bucle post-onboarding.

### Estado: feature 35 en implementación.

### Artefactos de esta sesión

- Feature en backlog: `35 — fix-onboarding-status-wire-format` (`in_progress`), con dependencia directa de la feature 29.
- Spec creada: `specs/35_fix-onboarding-status-wire-format/requirements.md`.
- Análisis permanente: `progress/research/fix-onboarding-status-wire-format.md`.
