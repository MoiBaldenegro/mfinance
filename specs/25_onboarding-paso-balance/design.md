# Diseño — Feature 25: onboarding-paso-balance

## 1. Componentes y estructura

```
src/components/onboarding/
├── OnboardingPasoBalance.tsx       # Contenedor 3 secciones colapsables
├── OnboardingPasoBalance.css
├── ActivosSection.tsx              # CRUD activos
├── ActivosSection.css
├── PasivosSection.tsx              # CRUD pasivos
├── PasivosSection.css
├── InversionesSection.tsx          # Familias inversión
├── InversionesSection.css
└── index.ts
```

## 2. Layout - Sección Activos

```
┌─ Activos ──────────────────────────┐
│  [+ Añadir activo]                 │
├────────────────────────────────────┤
│  💰 Efectivo          $15,000.00  ✎│
│  🏠 Vivienda          $250,000.00 ✎│
│  📈 Cartera           $45,000.00  ✎│
│  ────────────────────────────────  │
│  Total activos:      $310,000.00   │
└────────────────────────────────────┘
```

**Modal/Inline "Añadir/Editar activo"**:
- Nombre (texto, requerido)
- Categoría: select [Líquido, Inversión, Propiedad]
- Valor actual (numérico, > 0, formateado con `formatoMoneda`)
- Botones: Cancelar / Guardar

## 3. Layout - Sección Pasivos

```
┌─ Pasivos ──────────────────────────┐
│  [+ Añadir pasivo]                 │
├────────────────────────────────────┤
│  🏦 Hipoteca          $180,000.00  │
│     Tasa: 3.25%        ✎  🗑       │
│  💳 Tarjeta           $2,500.00    │
│     Tasa: 18.5%        ✎  🗑       │
│  ────────────────────────────────  │
│  Total pasivos:      $182,500.00   │
└────────────────────────────────────┘
```

**Modal/Inline "Añadir/Editar pasivo"**:
- Nombre (texto, requerido)
- Saldo pendiente (numérico, > 0)
- Tasa interés anual (numérico, ≥ 0, máx 30%, step 0.01)
- Botones: Cancelar / Guardar

## 4. Layout - Sección Inversiones

```
┌─ Inversiones ──────────────────────┐
│  ┌────────────────────────────────┐ │
│  │ Renta fija                     │ │
│  │ Aporte mensual:  $500.00       │ │
│  │ Valor actual:    $12,000.00    │ │
│  │ Tasa esperada:   4.5% ▼        │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Renta variable                 │ │
│  │ Aporte mensual:  $300.00       │ │
│  │ Valor actual:    $8,000.00     │ │
│  │ Tasa esperada:   8.0% ▼        │ │
│  └────────────────────────────────┘ │
│  ┌────────────────────────────────┐ │
│  │ Finca raíz                     │ │
│  │ Aporte mensual:  $0.00         │ │
│  │ Valor actual:    $0.00         │ │
│  │ Tasa esperada:   3.0% ▼        │ │
│  └────────────────────────────────┘ │
└────────────────────────────────────┘
```

## 5. Tokens CSS

- Mismos tokens que feature 24
- Estados vacíos: clase compartida `.empty-state` (patrón visual común feature 18)
- Tablas/listas: `var(--space-md)` gap, `var(--radius-md)` cards
- Inputs numéricos: alineación derecha, sufijo moneda vía `formatoMoneda`

## 6. Validación inline

- Valor ≤ 0: borde error + mensaje "Debe ser mayor que cero"
- Tasa > 30%: borde error + mensaje "Tasa máxima 30% anual"
- Guardar deshabilitado si campos inválidos

## 7. Persistencia

- `onChange` con debounce 500ms → `actualizarDatos({ balance: { activos, pasivos, inversiones }})`
- Al cambiar de paso: flush inmediato sin debounce