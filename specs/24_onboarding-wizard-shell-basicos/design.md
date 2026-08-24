# Diseño — Feature 24: onboarding-wizard-shell-basicos

## 1. Componentes y estructura

```
src/components/onboarding/
├── OnboardingWizard.tsx          # Shell: progreso, navegación, contenedor paso
├── OnboardingPaso1.tsx           # Datos personales, moneda, fuentes, categorías
├── OnboardingPaso1.css
├── OnboardingWizard.css          # Estilos shell (barra progreso, botones)
└── index.ts                      # Exports
```

## 2. Flujo de navegación

- **Barra de progreso**: 5 pasos (1. Básicos, 2. Balance, 3. Deuda/Proyección, 4. Metas, 5. Resumen)
- **Botones**: Atrás (deshabilitado en paso 1), Siguiente (validación paso actual), Finalizar (paso 5), Saltar (paso 1)
- **Estado**: `currentStep` (1-5), `stepData` (objeto con datos de cada paso), `isSubmitting`
- **Persistencia**: `useEffect` con debounce 500ms → `actualizarDatos(perfilId, stepData[currentStep])`

## 3. Paso 1 - Layout

```
┌─────────────────────────────────────┐
│  1. Datos personales                │
│  ┌───────────────────────────────┐  │
│  │ Nombre completo *             │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ Moneda ▼ [MXN] [USD] [EUR]    │  │
│  └───────────────────────────────┘  │
├─────────────────────────────────────┤
│  2. Fuentes de ingreso (mín. 1)     │
│  ☑ Salario    ☑ Freelance           │
│  ☐ Arriendos  ☐ Otros               │
├─────────────────────────────────────┤
│  3. Categorías de gasto (mín. 1)    │
│  ☑ Vivienda   ☑ Alimentación        │
│  ☑ Transporte ☑ Cuotas deuda        │
│  ☐ Ocio       ☐ Otros               │
├─────────────────────────────────────┤
│  [Saltar onboarding]    [Siguiente] │
└─────────────────────────────────────┘
```

## 4. Tokens CSS utilizados

- Colores: `var(--color-bg)`, `var(--color-surface)`, `var(--color-primary)`, `var(--color-text)`, `var(--color-text-muted)`, `var(--color-error)`, `var(--color-success)`
- Espaciado: `var(--space-xs)`, `var(--space-sm)`, `var(--space-md)`, `var(--space-lg)`, `var(--space-xl)`
- Radio: `var(--radius-sm)`, `var(--radius-md)`, `var(--radius-lg)`
- Sombra: `var(--shadow-sm)`, `var(--shadow-md)`
- Tipografía: `var(--font-sans)`, `var(--text-base)`, `var(--text-lg)`, `var(--text-xl)`, `var(--font-medium)`, `var(--font-semibold)`

## 5. Estados de validación

- Campo requerido vacío: borde `var(--color-error)`, mensaje `var(--color-error)` abajo
- Grupo (fuentes/categorías) sin selección: mensaje error bajo el grupo
- Botón Siguiente: `disabled` si paso inválido, `opacity-0.5 cursor-not-allowed`

## 6. Accesibilidad

- `aria-label` en botones, `aria-invalid` en campos con error, `role="alert"` en mensajes error
- Navegación por Tab ordenada, foco visible (`:focus-visible` con `var(--color-primary)`)
- Contraste AA mínimo en ambos temas (tokens garantizan)

## 7. Responsive

- Mobile first: stack vertical, botones ancho completo en < 480px
- Tablet/desktop: max-width 640px centrado, padding `var(--space-xl)`