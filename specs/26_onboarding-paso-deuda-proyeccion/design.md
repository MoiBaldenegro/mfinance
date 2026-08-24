# Diseño — Feature 26: onboarding-paso-deuda-proyeccion

## 1. Componentes y estructura

```
src/components/onboarding/
├── OnboardingPasoDeudaProyeccion.tsx
├── OnboardingPasoDeudaProyeccion.css
├── DeudaSection.tsx
├── DeudaSection.css
├── ProyeccionSection.tsx
├── ProyeccionSection.css
└── index.ts
```

## 2. Layout - Sección Estrategia de Deuda

```
┌─ Estrategia de deuda ──────────────┐
│  ○ Avalancha (mayor tasa primero)  │
│    Paga primero la deuda con mayor │
│    interés. Ahorra más en intereses│
│                                    │
│  ● Bola de nieve (menor saldo)     │
│    Paga primero la deuda más chica.│
│    Motivación rápida al eliminar   │
│    deudas completas.               │
├────────────────────────────────────┤
│  Pago extra mensual                │
│  ┌──────────────────────────────┐  │
│  │ $ 300.00          /mes       │  │
│  └──────────────────────────────┘  │
│  Este monto se suma al pago mínimo │
│  de la deuda objetivo según la     │
│  estrategia elegida.               │
└────────────────────────────────────┘
```

## 3. Layout - Sección Supuestos de Proyección

```
┌─ Supuestos de proyección (12 meses) ┐
│  ┌─────────────────┬──────────────┐ │
│  │ Variable        │ Cambio %     │ │
│  ├─────────────────┼──────────────┤ │
│  │ Salario         │ +2.0% ▼      │ │
│  │ Freelance       │ +0.0% ▼      │ │
│  │ ───────────────┼──────────────┤ │
│  │ Vivienda        │ +1.5% ▼      │ │
│  │ Alimentación    │ +2.0% ▼      │ │
│  │ Transporte      │ +0.0% ▼      │ │
│  │ Cuotas deuda    │ +0.0% ▼      │ │
│  │ Ocio            │ +0.0% ▼      │ │
│  │ ───────────────┼──────────────┤ │
│  │ Revaloriz. act. │ +1.0% ▼      │ │
│  │ Interés pasivos │ +0.0% ▼      │ │
│  └─────────────────┴──────────────┘ │
│  [Restablecer a 0%]                  │
├──────────────────────────────────────┤
│  Vista previa (solo lectura)         │
│  ┌────────────────────────────────┐  │
│  │ Mes 1  | Ingr: $5,200 | Gas: $3,100 │
│  │        | Util: $2,100 | Ahorro: $2,100│
│  │ ...                                 │
│  │ Mes 12 | Ingr: $6,100 | Gas: $3,500 │
│  │        | Util: $2,600 | Ahorro: $31,200│
│  └────────────────────────────────┘  │
│  Patrimonio: $310k → $345k (+11%)    │
└──────────────────────────────────────┘
```

## 4. Tokens CSS

- Mismos tokens base
- Radio buttons: `var(--color-primary)` para checked, `var(--color-border)` para unchecked
- Tabla supuestos: `var(--space-sm)` padding celdas, `var(--color-border)` divisores
- Vista previa: `var(--color-surface)` fondo, `var(--text-sm)` tipografía
- Badge "solo lectura": `var(--color-text-muted)` fondo `var(--color-bg)`

## 5. Validación

- Pago extra: numérico ≥ 0, step 10, formateado con `formatoMoneda`
- Supuestos: input numérico con % (-50 a +100), step 0.1, validación en blur
- Botón "Restablecer a 0%": pone todos los supuestos a 0, recalcula vista previa

## 6. Reutilización de motores (sin duplicación)

- `DeudaSection` usa caso de uso `calcularProyeccionDeuda` (puerto `DeudaPort`) que delega al motor de feature 9
- `ProyeccionSection` usa caso de uso `calcularProyeccionPyg` (puerto `ProyeccionPort`) que delega al motor de feature 14
- Los casos de uso de onboarding son **finos**: solo transforman datos de UI → llaman puertos → guardan en onboarding_data

## 7. Persistencia

- Debounce 500ms en todos los campos
- `actualizarDatos({ deuda: { estrategia, pagoExtra }, proyeccion: { supuestos }})`