# Diseño — Feature 27: onboarding-paso-metas-completar

## 1. Componentes y estructura

```
src/components/onboarding/
├── OnboardingPasoMetas.tsx         # Paso 4: Umbrales + Journal
├── OnboardingPasoMetas.css
├── IndicadoresUmbralesSection.tsx
├── IndicadoresUmbralesSection.css
├── MetasJournalSection.tsx
├── MetasJournalSection.css
├── OnboardingPasoResumen.tsx       # Paso 5: Resumen + Finalizar
├── OnboardingPasoResumen.css
└── index.ts
```

## 2. Layout - Paso 4: Umbrales de Indicadores

```
┌─ Umbrales de indicadores ─────────┐
│  Personaliza cuándo cada semáforo  │
│  se pone verde/rojo. Los valores   │
│  por defecto son los estándar.     │
├────────────────────────────────────┤
│  ┌─ Endeudamiento ──────────────┐  │
│  │ Verde si ≤ 15%     [ 15 ] %  │  │
│  │ Rojo  si ≥ 30%     [ 30 ] %  │  │
│  └──────────────────────────────┘  │
│  ┌─ Tasa de ahorro ─────────────┐  │
│  │ Verde si ≥ 15%     [ 15 ] %  │  │
│  │ Rojo  si < 5%      [  5 ] %  │  │
│  └──────────────────────────────┘  │
│  ┌─ Fondo emergencia ────────────┐  │
│  │ Verde si ≥ 3 meses [ 3 ] mes  │  │
│  │ Rojo  si < 1 mes   [ 1 ] mes  │  │
│  └──────────────────────────────┘  │
│  ┌─ Ingreso pasivo ──────────────┐  │
│  │ Verde si ≥ 100%    [ 100 ] %  │  │
│  │ Amarillo si ≥ 25%  [ 25 ] %   │  │
│  └──────────────────────────────┘  │
│  [Restaurar valores por defecto]    │
└────────────────────────────────────┘
```

## 3. Layout - Paso 4: Mis Metas (Journal)

```
┌─ Mis metas (Journal) ─────────────┐
│  Escribe tus objetivos financieros │
│  en tus propias palabras. Sin      │
│  formato rígido: libre, personal.  │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ Título *                     │  │
│  │ [ Comprar casa en 5 años ]   │  │
│  ├──────────────────────────────┤  │
│  │ Descripción                  │  │
│  │ [ Quiero tener el 20% de     │  │
│  │   entrada para una casa en   │  │
│  │   zona centro. Priorizo      │  │
│  │   ahorro sobre inversiones   │  │
│  │   de riesgo. ]               │  │
│  ├──────────────────────────────┤  │
│  │ Tags: [casa] [ahorro] [5años]│  │
│  └──────────────────────────────┘  │
│  [+ Añadir meta]                   │
├────────────────────────────────────┤
│  📝 Comprar casa en 5 años    ✎ 🗑 │
│     Quiero tener el 20%...         │
│     #casa #ahorro #5años           │
│  📝 Jubilarme a los 55          ✎ 🗑│
│     Busco independencia...         │
│     #jubilación #libertad          │
└────────────────────────────────────┘
```

## 4. Layout - Paso 5: Resumen y Confirmación

```
┌─ Resumen de tu onboarding ────────┐
│  ✓ Datos personales                │
│    Nombre: Ana García              │
│    Moneda: MXN ($)                 │
│  ✓ Fuentes: Salario, Freelance     │
│  ✓ Categorías: Vivienda, Aliment.. │
│  ✓ Balance                         │
│    Activos: $310,000 | Pasivos...  │
│  ✓ Deuda: Avalancha, $300 extra    │
│  ✓ Proyección: 8 supuestos editados│
│  ✓ Indicadores: Umbrales personal. │
│  ✓ Metas: 2 entradas en journal    │
├────────────────────────────────────┤
│  [Finalizar onboarding]            │
└────────────────────────────────────┘
```

## 5. Tokens CSS

- Mismos tokens base
- Journal entries: cards con `var(--color-surface)`, `var(--radius-md)`, `var(--shadow-sm)`
- Tags: `var(--color-primary-bg)` fondo, `var(--color-primary)` texto, `var(--radius-sm)`
- Resumen: lista con iconos check `var(--color-success)`, `var(--text-base)`
- Botón primario Finalizar: `var(--color-primary)` fondo, `var(--color-on-primary)` texto

## 6. Validación

- Umbrales: validación cruzada (verde > rojo para endeudamiento/fondo; verde < rojo para ahorro/ingreso_pasivo); mensaje inline si incoherente
- Meta: título requerido ≤100, descripción ≤5000, tags ≤5 × ≤20 chars; contador de caracteres visible
- Botón Finalizar: habilitado siempre (usuario puede tener 0 metas, umbrales por defecto)

## 7. Integración Ajustes (feature 22)

- En lista de perfiles: badge "Onboarding en progreso" (amarillo) si `InProgress`
- Botón "Reanudar" abre wizard en `current_step` con datos cargados
- Post-onboarding: sub-sección "Mis metas" en Ajustes para ver/editar/añadir journal
- Toast de bienvenida: `var(--color-success)` fondo, duración 4s, auto-dismiss

## 8. Consolidación backend (completarOnboarding)

El caso de uso `completarOnboarding` transforma `onboarding_data` en:
- `StrategySettings`: currency, debt_strategy, extra_monthly_payment
- `Investment.tasa_esperada` por familia (renta_fija, renta_variable, finca_raiz)
- `financial_profile`: fuentes_ingreso_activas, categorias_gasto_usadas, umbrales_indicadores
- Marca `onboarding_status = Completed`

## 9. Persistencia

- Paso 4-5: mismo patrón debounce 500ms + flush al cambiar paso
- `goals_journal` se guarda como array completo en perfil (no en onboarding_data)