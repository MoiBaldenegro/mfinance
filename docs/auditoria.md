# Auditoría integral de mfinance (2026-10-30)

Método: app Tauri real (`pnpm tauri dev`) sobre una COPIA de los datos
(`MFINANCE_DATA_DIR`), conducida por CDP (WebView2 remote debugging) con
capturas a 800px (ventana por defecto) y 1280px de las diez secciones.

## 0. Arnés (resuelto; después el arnés se eliminó por decisión del dueño)

- `./init.sh` en rojo en una máquina Windows recién clonada:
  `core.autocrlf=true` → checkout CRLF → los validadores parten por `\n` y
  no reconocen ninguna entrada de `docs/dependencies.md`. Arreglo:
  `.gitattributes` con `eol=lf` y renormalización del árbol.
- `tests/fixtures/rollback-perfil-vista/montaje-integracion.mjs` tenía la
  ruta absoluta de la ubicación antigua del repo → ruta relativa a
  `import.meta.url`.
- Archivo basura en la raíz con nombre de ruta Windows aplastada
  (duplicado de una entrada de `progress/history.md`) → eliminado.

## 1. Bugs visuales (por sección)

Transversales:
- **No existe sistema de componentes**: 92 hojas CSS, cada sección
  reinventa card, botón, input, tabla y cabecera → cuatro estilos de
  contenedor distintos (card, card con borde doble grueso en Deuda y
  Proyección, sin card en Inversiones/Conciliación), tres anchos máximos.
- Controles nativos sin estilo: botón «Restablecer a cero» blanco,
  `input[type=file]` del sistema, radios azules del navegador, input de
  mes en monospace (Conciliación).
- Ventana por defecto 800×600 sin tamaño mínimo: las 10 pestañas
  desbordan (Diagnóstico/Ajustes quedan ocultas, scroll horizontal).
- Separadores de 4px (`border: var(--space-1)`) usados como líneas → barras
  gruesas en tablas, pestañas y totales.
- Formato de importes inconsistente: `$30` vs `$22,500.00`, símbolo `$`
  como sufijo tras el input, «0,0 %» (coma) junto a «$22,500.00» (punto).
- Cabecera verde saturada a ancho completo + pastilla de perfil casi
  invisible; mucho ruido de color sin jerarquía.

Por sección:
- **Registro**: leyendas de fieldset montadas sobre el borde de la card;
  flechas de mes de 8px casi invisibles; ingresos/gastos con alturas
  desiguales.
- **PyG**: mes partido en dos líneas («2026-/09»); filas proyectadas con
  texto verde sobre fondo verde (ilegible); badge PROYECTADO amarillo
  alineado a la derecha dentro de la columna Mes; leyenda de la gráfica
  con cajas vacías; eje X «0 ★»; triple anidación card>card>card.
- **Balance**: hueco vacío de ~70px entre KPIs y estado vacío; mensaje
  vacío que dice «en la sección Balance» estando en Balance.
- **Deuda**: borde doble gris de 4px; la card del simulador desborda el
  contenedor; botón «Comparar estrategias» con aspecto deshabilitado.
- **Inversiones**: sin card; inputs de la tabla sin borde (parecen texto);
  nombres en minúsculas y sin tilde («finca raiz»); tres series del mismo
  verde en la gráfica (indistinguibles).
- **Indicadores**: «VERDE»/«ROJO» como texto en mayúsculas en lugar de un
  estado legible; sin explicación ni umbral.
- **Conciliación**: sin card, ancho 900px distinto al resto; abre en
  2026-10 cuando el mes de trabajo es 2026-09.
- **Cierre**: barra de progreso blanca brillante; consejos con títulos
  contradictorios («Deuda fuera de control» en verde con texto «Deuda bajo
  control»; «Ahorro crítico» en verde con «Buen ritmo de ahorro»).
- **Diagnóstico**: selector de archivos nativo; abre en 2026-10.
- **Ajustes**: rótulo «Mis metas» duplicado; asterisco de obligatorio en
  línea propia; error «el título es obligatorio» visible antes de tocar
  nada; mezcla de bordes de 4px y 1px; perfiles sin acción de renombrar.

## 2. Arquitectura

- Dominio puro respetado (sin React/Tauri en `src/domain`), backend con
  capas correctas.
- **Sin composition root en el frontend**: 22 hooks/componentes importan
  adapters concretos (singletons) → no hay inyección de puertos; los
  componentes dependen de infraestructura de forma transitiva.
- `src/lib/bus-ui.ts` importa `@tauri-apps/api` fuera de `src/adapters/`.
- CSS fuera de `src/styles/` (`ConciliacionSection.css`).
- Archivos >100 líneas: `snapshot-ipc-adapter.ts` (155),
  `OnboardingPaso1.tsx` (159), `onboarding-wizard.css` (251) y otros.

## 3. Producción

- `tauri.conf.json`: `csp: null`, ventana 800×600 sin `minWidth`,
  `productName` en minúscula, icono por defecto de Tauri/Vite.
- Comando de ejemplo `greet` registrado en el backend.
- `index.html` usa el favicon de Vite.

## 4. Bugs funcionales encontrados al verificar en la app real

- Instalación nueva: la app no arrancaba (exigía el snapshot de un perfil
  que aún no completó el onboarding). Corregido con test.
- Deuda: cambiar estrategia o pago extra se revertía al instante (se
  guardaba sin publicar el snapshot). Corregido.
- Motor de deuda: pago mínimo menor que el interés (deuda infinita) y sin
  rollover del mínimo liberado (Avalancha y Bola de nieve daban lo mismo
  sin pago extra). Corregido con tests.
- Contrato IPC: la categoría de activo viajaba como «Liquido» y la UI espera
  «liquido». Corregido en serde con alias para datos ya guardados.
- Balance: altas/ediciones no refrescaban la tabla; cada operación
  parpadeaba a «Cargando»; editar el nombre duplicaba el activo.
- Inversiones: imposible escribir decimales en los campos.
- Indicadores: hook condicional (violaba las reglas de React).
- Cierre: consejos con título contradictorio («Deuda fuera de control» en
  verde) y textos amarillos con umbrales erróneos.
- Gráficas de proyección: el eje X mostraba índices en vez de meses.
- Metas: «Editar» no rellenaba el formulario.
- Conciliación: botón «Confirmar cierre» que solo hacía alert().

## 5. Pendientes (requieren decisión de producto)

- **Conciliación**: los extractos de cuenta no tienen mes (el parámetro se
  ignora) y no existe comando para crear una cuenta; solo hay cuentas en
  los datos de ejemplo. Requiere rediseñar ese dominio.
- **Reanudar onboarding**: el paso actual no se persiste (el backend solo
  conoce `current_step: 1`), así que reanudar siempre vuelve al paso 1.
- **Indicador de endeudamiento**: se calcula con «Cuotas de deuda» del
  registro mensual, no con los pasivos de Balance; con deudas registradas
  pero sin cuotas capturadas aparece como «Saludable».
