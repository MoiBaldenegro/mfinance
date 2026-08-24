# Informe de implementación — Feature 20: moneda-ui-ajustes

> Implementador, 2026-08-23. Specs regentes:
> `specs/20_moneda-ui-ajustes/requirements.md` + `design.md`. Análisis de
> fondo: `progress/research/config-monedas-perfiles.md` §2/§4. Estado
> final: **suite completa en verde**, feature queda `in_progress` a la
> espera del review (el cambio a `done` lo decide el líder tras APPROVED).

## 1. Ciclo ROJO (tests antes que código)

Creados ANTES de tocar código los tests de `tests/moneda-ui/`
(`formateadores-migrados.test.mjs`, `selector-moneda.test.mjs`,
`greps-moneda.test.mjs`) contra las firmas/comportamientos objetivo.

Comandos y salidas resumidas (rojo):

```
node --test tests/moneda-ui/formateadores-migrados.test.mjs ...
→ SyntaxError: ... 'conciliacion-logic.ts' does not provide an export
  named 'formatearImporte'          (la firma con moneda no existía)
→ Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '.../src/domain/use-cases/cambiar-moneda.ts'
  (tampoco existían moneda-snapshot.ts ni ETIQUETA_MONEDA)
→ greps-moneda: fail 2 —
  · es-ES presente en src/domain/use-cases (conciliacion-logic.ts,
    inversiones-proyeccion.ts y comentarios en balance-tabla,
    deuda-tabla, simulador-comparativa, pyg-proyeccion-tabla)
  · € presente en 8 archivos de src/components (ActivoForm PasivoForm
    PanelEstrategia FormularioCredito DiagnosticoTabla GraficaProyeccion
    TablaInversiones CampoImporte)
# pass 0 / # fail 4
```

## 2. Ciclo VERDE (implementación)

```
pnpm test   → # tests 333 / # pass 333 / # fail 0   (26 nuevos: moneda-ui)
cargo test --manifest-path src-tauri/Cargo.toml → 233 passed; 0 failed
             (backend SIN cambios esta sesión; corrida como evidencia)
node scripts/audit-design-tokens.mjs → AUDIT ✔
./init.sh   → ✔ formato · ✔ tests al 100% · ✔ build · El entorno está perfecto
grep -rn "es-ES" src/domain/use-cases | wc -l  → 0
grep -rn "€" src/components            | wc -l  → 0
```

## 3. Arquitectura de la solución

- **Punto único de formateo**: se ELIMINAN `formatoEuros`
  (resumenes-flujo) y las dos `formatearEuros` divergentes
  (conciliacion-logic con `Intl es-ES`, inversiones-proyeccion con
  `toLocaleString('es-ES')`). Todo pasa por `formatoMoneda(valor, moneda[,
  decimales])` del núcleo F19.
- **La moneda viaja en los datos**: las funciones de tabla reciben
  `moneda: Moneda` como parámetro (REQ-20-03, verificable por test); los
  resúmenes la derivan del snapshot con la guardia `monedaDeSnapshot`.
- **Propagación única** (design.md decisión 2): `MonedaContext` +
  `usarMoneda()` (patrón use-tema). El proveedor vive UNA vez en AppShell
  con `monedaDeSnapshot(snapshot.strategy.currency)`; fuente de verdad
  única = el snapshot (evita el doble estado store/snapshot).
- **Persistencia**: `useCambioMoneda` construye el snapshot nuevo con el
  caso de uso puro `cambiarMoneda`, lo guarda por el puerto existente
  (`snapshotPort.save` → save_state IPC sin commands nuevos) y publica con
  `aplicarSnapshot`; el re-render del contexto reformatea al instante toda
  la UI visible (REQ-20-01/02).
- **Re-etiquetado sin conversión**: ningún importe se transforma; solo
  símbolo/separadores del catálogo (research §3).

## 4. Archivos creados (wc -l, todos ≤ 100)

| Archivo | wc -l |
|---|---|
| `src/hooks/use-moneda.ts` | 18 |
| `src/domain/use-cases/moneda-snapshot.ts` | 19 |
| `src/domain/use-cases/cambiar-moneda.ts` | 22 |
| `src/components/ajustes-section/SelectorMoneda.tsx` | 42 |
| `src/components/ajustes-section/use-cambio-moneda.ts` | 39 |
| `src/styles/selector-moneda.css` | 41 |
| `tests/moneda-ui/formateadores-migrados.test.mjs` | 81 |
| `tests/moneda-ui/formateadores-deuda-simulador.test.mjs` | 97 |
| `tests/moneda-ui/resumenes-moneda.test.mjs` | 44 |
| `tests/moneda-ui/greps-moneda.test.mjs` | 46 |
| `tests/moneda-ui/selector-moneda.test.mjs` | 93 |
| `tests/frontend-shell/inversiones-formato.test.mjs` | 55 |

## 5. Archivos modificados (wc -l, todos ≤ 100)

Dominio: `entities/moneda.ts` 57 (+etiquetas ES y simboloDe);
`resumenes-flujo.ts` 65; `resumenes-patrimonio.ts` 71;
`resumenes-secciones.ts` 39; `pyg-tabla.ts` 39;
`pyg-proyeccion-tabla.ts` 49; `balance-tabla.ts` 62;
`balance-futuro-tabla.ts` 47; `deuda-tabla.ts` 58;
`simulador-comparativa.ts` 79; `conciliacion-logic.ts` 50;
`inversiones-proyeccion.ts` 48; `formato-moneda.ts` 36 (comentario).

Componentes: `shell/AppShell.tsx` 57 (proveedor); `ajustes-section/
AjustesSection.tsx` 51; registro `RegistroSection` 86, `TarjetaMontos` 58,
`CampoImporte` 62 (sufijo = símbolo activo); pyg `PygSection` 76,
`PygChart` 74; proyección `PanelesProyeccion` 99, `ProyeccionChart` 100,
`BalanceFuturoChart` 100; balance `BalanceCards` 41, `BalanceChart` 80,
`ActivosTable` 70, `PasivosTable` 68, `ActivoForm` 98, `PasivoForm` 95;
deuda `ContenidoPlan` 77, `ListaDeudas` 48, `DeudaChart` 88,
`PanelEstrategia` 56, simulador `SimuladorPanel` 78, `PlanSandbox` 86,
`FormularioCredito` 55; inversiones `TablaInversiones` 86,
`TotalInvertido` 19, `ProyeccionResumen` 39, `GraficaProyeccion` 85;
cierre `PasoRepaso/PasoPresupuesto/PasoConfirmacion/PanelMesCerrado/
HistoricoCierres`; conciliación `MovimientoLista` 32,
`CuentaConciliadaCard` 99; diagnóstico `DiagnosticoTabla` 79,
`DiagnosticoFila` 100; estilos `styles/ajustes-section.css` 76.

Tests legacy migrados mecánicamente a EUR (mismas aserciones):
`helpers.mjs` (fixture strategy gana currency:'EUR'), `pyg-tabla`,
`balance-tabla`, `balance-futuro-tabla`, `balance-futuro-patrimonio`,
`deuda-tabla`, `simulador-comparativa`, `simulador-amortizacion`,
`pyg-proyeccion-tabla`, e `inversiones-logic` dividido en dos archivos
(135→77+55).

## 6. Verificación criterio por criterio

1. **TDD rojo→verde formateadores con moneda MXN/EUR** — CUMPLE. Rojo §1
   (export inexistente / módulo inexistente / greps en fallo); verde §2:
   `formateadores-migrados` + `formateadores-deuda-simulador` +
   `resumenes-moneda` cubren PyG Balance Deuda Conciliación Inversiones
   Simulador Cierre(vía resúmenes/presupuesto) Registro(vía totales del
   formulario y resumen) con casos exactos `$1,576.00` / `1.576,00 €`.
2. **grep es-ES en src/domain/use-cases = 0 y grep € en src/components
   = 0** — CUMPLE (comandos en §2). Además quedan como test permanente
   `greps-moneda.test.mjs` para que el arnés lo vigile siempre.
3. **Selector de Ajustes: tres monedas etiquetadas en español, marca la
   activa, reformateo al instante y persistencia vía save_state** —
   CUMPLE. `ETIQUETA_MONEDA` (Pesos mexicanos/Dólares/Euros) testeada;
   `SelectorMoneda` renderiza MONEDAS con aria-pressed; `useCambioMoneda`
   persiste por `snapshotPort.save` (save_state existente) y publica el
   snapshot; el contexto dispara el reformateo instantáneo de todas las
   secciones y las gráficas redibujan (moneda en deps del efecto).
4. **Snapshot antiguo sin currency → MXN sin errores** — CUMPLE.
   `monedaDeSnapshot` testeada (undefined/null/sin strategy/fuera de
   catálogo/minúsculas → MXN); AppShell la usa como valor del proveedor;
   defecto del contexto también MXN; test específico con fixture antiguo.
5. **CampoImporte sufijo = símbolo activo; cabeceras con euro fijo →
   símbolo activo** — CUMPLE. CampoImporte consume usarMoneda();
   cabeceras/etiquetas actualizadas en TablaInversiones (×2), ActivoForm,
   PasivoForm, PanelEstrategia (+aria), FormularioCredito (×3),
   DiagnosticoTabla; aria "en euros" de DiagnosticoFila/PanelEstrategia
   re-etiquetadas.
6. **Solo tokens (audit OK), ningún archivo >100 líneas, ./init.sh
   verde** — CUMPLE: `audit-design-tokens` AUDIT ✔; máximo 100 líneas
   (ProyeccionChart/BalanceFuturoChart/DiagnosticoFila ya estaban en el
   límite, compactados sin crecer); `./init.sh` completo en verde.

## 7. Decisiones tomadas

- **Contexto en shell en lugar de observable lib/**: design.md admite
  «hook/contexto en shell siguiendo el patrón estado-tema/use-tema». Se
  eligió contexto alimentado por el snapshot para mantener UNA sola fuente
  de verdad (un store paralelo habría podido desincronizarse de
  `strategy.currency` al guardar desde otras secciones). API espejo de
  use-tema: `usarMoneda()`.
- **Eliminación (no renombrado) de los tres formateadores**: converge todo
  en `formatoMoneda`; los nombres "…Euros" serían mentira con MXN/USD.
  Los ~40 puntos de llamada se tocan igualmente para añadir la moneda.
- **Guardia `monedaDeSnapshot`**: además del serde default de Rust, el
  camino front queda blindado (snapshots importados o fixtures viejos sin
  campo caen a MXN sin lanzar), REQ-20-06.
- **Tests legacy a EUR, no borrados**: conservan sus aserciones históricas
  añadiendo el argumento; los casos MXN viven en la suite nueva. Única
  excepción documentada: `formatearProyeccion` ahora agrupa miles en la
  banda 1.000–9.999 (núcleo canónico de la F19), aserciones actualizadas.
- **División de archivos en el límite**: mi suite de tablas (205 líneas)
  se partió en tres módulos cohesivos; `inversiones-logic.test.mjs`
  (preexistente a 134, tocado por la migración del formateador) se dividió
  en lógica vs formato+y sumarAportes.
- **Hoja propia del selector**: `selector-moneda.css` nuevo porque ampliar
  `ajustes-section.css` superaba las 100 líneas que su propio test
  estructural exige; un componente, una hoja.
- **Sin conversión de importes**: no hay tasas ni transformación de
  valores; solo presentación (research §3, design.md alternativa
  descartada).

## 8. Alcance NO tocado

- Backend Rust: cero cambios (233 tests intactos en verde).
- Perfiles/almacenamiento (features 21/22): intocado.
- Sin dependencias npm ni crates nuevas; sin subagentes lanzados.
- Feature queda `in_progress`: pendiente review externo.
