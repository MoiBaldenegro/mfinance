# Análisis — Secuencia de onboarding al crear perfil

> Informe de spec_author (2026-08-23). Requerimiento del humano:
> "crear perfiles debería ser una secuencia para conocer al usuario, y tener
> recabada toda la información de él, sobre todas las funcionalidades y los
> objetivos, incluso que pueda poner información personal sobre sus metas de
> formas incluso abstracta a modo de journal o descripción"

## 1. Reafirmación del problema y alcance

El humano quiere que **crear un nuevo perfil no sea solo "poner un nombre"** (estado actual en feature 22), sino un **wizard guiado de varios pasos** que:

1. **Conozca al usuario**: datos personales básicos, moneda, preferencias
2. **Recabe toda su información financiera** a lo largo de las funcionalidades existentes:
   - Fuentes de ingreso y categorías de gasto (Registro mensual)
   - Activos, pasivos, patrimonio (Balance general)
   - Estrategia de deuda y pago extra (Plan de deuda)
   - Familias de inversión y tasas esperadas (Inversiones)
   - Umbrales de indicadores personalizados (Indicadores)
3. **Capture metas y objetivos en forma libre**: journal, descripciones abstractas, objetivos de vida, no solo números

**Fuera de alcance**: i18n de la UI, conversión de monedas con API, eliminación de perfiles (ya propuesto en config-monedas-perfiles.md §6.3 ítem 13).

## 2. Estado actual relevante

- **Features 21-22 done**: Modelo `Perfil { id, nombre, creado_en }` + `profiles.json` con perfil activo; snapshots aislados en `perfiles/<id>/mfinance.json`; commands `listar_perfiles`, `crear_perfil`, `seleccionar_perfil`; UI en Ajustes con lista, creación simple por nombre, indicador en cabecera.
- **Módulos funcionales existentes** (features 6-16): Registro, PyG, Balance, Deuda, Inversiones, Indicadores, Conciliación, Cierre, Diagnóstico, Simulador, Proyección.
- **Moneda** (features 19-20): `StrategySettings.currency` en snapshot (MXN/USD/EUR, default MXN), núcleo de formateo determinista, selector en Ajustes.
- **Arquitectura hexagonal**: Backend dominio puro (sin tauri), frontend dominio/puertos/use-cases/adapters/components, IPC solo en adapters.

## 3. Cambios necesarios

### 3.1 Backend (Rust)
- Extender entidad `Perfil` en `domain/perfil.rs`:
  - `onboarding_status: OnboardingStatus` (NotStarted | InProgress { current_step } | Completed)
  - `onboarding_data: OnboardingData` (estructura con todos los campos recopilados)
  - `goals_journal: Vec<GoalEntry>` (entradas de metas estilo journal: título, descripción libre, fecha, tags)
  - `financial_profile: FinancialProfile` (preferencias: fuentes de ingreso activas, categorías de gasto usadas, estrategia deuda preferida, familias inversión, umbrales indicadores)
- Actualizar `PerfilRepository` y adapter JSON para persistir nuevos campos
- Commands: `actualizar_perfil_onboarding`, `completar_onboarding`, `obtener_onboarding_status`
- Migración: perfiles existentes → `onboarding_status = Completed` (ya tienen datos), `goals_journal = []`

### 3.2 Frontend (TS/React)
- **Puerto** `OnboardingPort` en `src/domain/ports/`
- **Adapter** IPC en `src/adapters/`
- **Casos de uso** en `src/domain/use-cases/onboarding/`
- **Wizard UI** en `src/components/onboarding/`:
  - Shell con navegación (atrás/siguiente), barra de progreso, persistencia de estado parcial
  - Paso 1: Datos personales + moneda + fuentes ingreso/categorías gasto
  - Paso 2: Balance (activos, pasivos, inversiones iniciales)
  - Paso 3: Deuda (estrategia, pago extra) + Proyecciones (supuestos)
  - Paso 4: Indicadores (umbrales personalizados) + Metas/Journal (entradas libres)
  - Paso 5: Resumen + Confirmación → completa onboarding y navega a la app
- **Integración**: Al crear perfil en Ajustes → lanza wizard; botón "Saltar" permite crear perfil mínimo; botón "Reanudar" si hay onboarding en progreso.

## 4. Descomposición en features (complejidad alta → 5 features)

| # | Feature | Tipo | Justificación |
|---|---------|------|---------------|
| 23 | `perfiles-onboarding-modelo` | Backend | Extiende Perfil con onboarding_status, goals_journal, financial_profile; commands; migración. Base para todo lo demás. |
| 24 | `onboarding-wizard-shell-basicos` | Frontend | Shell del wizard (navegación, progreso, persistencia parcial) + Paso 1 (datos personales, moneda, fuentes/categorías). Independientemente testeable. |
| 25 | `onboarding-paso-balance` | Frontend | Paso 2: Activos, pasivos, inversiones iniciales. Testeable por separado. |
| 26 | `onboarding-paso-deuda-proyeccion` | Frontend | Paso 3: Estrategia deuda, pago extra, supuestos proyección. Reusa motores existentes. |
| 27 | `onboarding-paso-metas-completar` | Frontend | Paso 4: Umbrales indicadores + Metas/Journal libre + Paso 5: Resumen/Confirmación + Integración (lanzar desde Ajustes, reanudar, saltar). |

**Orden de dependencias**:
```
23 (backend)
  └─ 24 (shell + paso 1)
       └─ 25 (paso 2)
            └─ 26 (paso 3)
                 └─ 27 (paso 4-5 + integración)
```

Cada feature es **independiente y testeable**: el backend se prueba con `cargo test`; cada paso del frontend tiene su propio caso de uso y componente, verificable con tests node:test contra puertos falsos.

## 5. Riesgos y trabas

- **100 líneas/archivo**: `perfil.rs` crece (hoy ~50 líneas); si supera 100, separar `onboarding.rs` y `goals_journal.rs` en `domain/`. Lo mismo en TS.
- **Persistencia de estado parcial**: El wizard debe guardar progreso en el snapshot del perfil (campo `onboarding_data`) sin completar el onboarding. Requiere `actualizar_perfil_onboarding` command.
- **Reutilización de lógica existente**: Los pasos deben reusar validaciones y cálculos de los use-cases actuales (Registro, Balance, Deuda, Inversiones, Indicadores) → no duplicar lógica.
- **Journal libre**: `GoalEntry` es texto libre (título + descripción + tags + fecha). Sin esquema rígido. Validación mínima: título no vacío, longitud razonable.
- **Sin dependencias nuevas**: Todo con código existente (Rust stdlib, TS nativo).
- **Dominio puro**: Nuevos tipos y traits en `domain/` sin `tauri` ni `react`.

## 6. Features creadas (IDs 23-27)

Todas con `status: "pending"` y `depends_on` encadenado. La spec de cada feature (requirements.md EARS + design.md donde toca UI) se crea en `specs/<NN>_<name>/` antes del alta en backlog.

---