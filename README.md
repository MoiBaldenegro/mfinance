<p align="center">
  <img src="src-tauri/icons/icon.png" alt="mfinance" width="88">
</p>

<h1 align="center">mfinance</h1>

<p align="center">
  <strong>Tus finanzas personales, claras como un cierre de mes.</strong><br>
  Registro, PyG, patrimonio, deuda e inversiones en una app de escritorio.<br>
  <em>100&nbsp;% local. Sin cuentas. Sin nube.</em>
</p>

<p align="center">
  <img alt="Tauri 2" src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white">
  <img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  <img alt="Rust" src="https://img.shields.io/badge/Rust-stable-000000?logo=rust&logoColor=white">
  <img alt="Windows" src="https://img.shields.io/badge/Windows-10%2F11-0078D4?logo=windows&logoColor=white">
</p>

<p align="center">
  <a href="https://github.com/MoiBaldenegro/mfinance/releases/latest">
    <img alt="Descargar para Windows" src="https://img.shields.io/badge/Descargar_para_Windows-24966F?style=for-the-badge&logo=windows&logoColor=white">
  </a>
  <a href="https://moibaldenegro.github.io/mfinance/">
    <img alt="Ver la web" src="https://img.shields.io/badge/Ver_la_web-0F1215?style=for-the-badge&logo=githubpages&logoColor=white">
  </a>
  <a href="docs/architecture.md">
    <img alt="Leer la arquitectura" src="https://img.shields.io/badge/Leer_arquitectura-24966F?style=for-the-badge&logo=readthedocs&logoColor=white">
  </a>
</p>

<p align="center">
  <img src="public/mfinance-preview.webp" alt="Landing de mfinance y vista previa de la app" width="820">
</p>

<p align="center">
  <sub>Landing oficial y vista previa de la app · <a href="https://moibaldenegro.github.io/mfinance/">moibaldenegro.github.io/mfinance</a></sub>
</p>

## Qué es mfinance

Una app de escritorio para llevar tus finanzas sin depender de una hoja de
cálculo ni de un servicio en la nube. Registras el mes, ves tu PyG y tu
patrimonio, planificas la salida de tus deudas, proyectas tus inversiones y
cierras el mes con un flujo guiado.

Todo se guarda en tu equipo. No hay registro, no hay cuenta y no hay
sincronización con servidores.

## Funciones

| Módulo | Qué resuelve |
| --- | --- |
| **Registro mensual** | Ingresos y gastos por mes, con subtotales y totales en vivo. |
| **PyG** | Serie histórica y proyección de ingresos, gastos, utilidad y ahorro. |
| **Balance y patrimonio** | Activos, pasivos y evolución del patrimonio en el tiempo. |
| **Plan de deuda** | Avalancha o bola de nieve, con simulador de créditos y pago extra. |
| **Inversiones** | Aporte mensual, interés compuesto y valor proyectado. |
| **Indicadores** | Semáforo de endeudamiento, fondo de emergencia, ahorro e ingreso pasivo. |
| **Cierre mensual** | Flujo guiado para revisar, conciliar y cerrar el mes. |
| **Conciliación** | Compara saldos esperados contra los reales de tus cuentas. |
| **Extractos PDF** | Lectura de extractos para apoyar la captura de movimientos. |
| **Perfiles y moneda** | Varios perfiles, tema oscuro/claro y moneda MXN, USD o EUR. |

## Privacidad primero

- Tus datos viven en `Documents/mfinance`.
- No hay servidor, cuenta ni sincronización.
- Si quieres usar otra carpeta para QA o demos, define `MFINANCE_DATA_DIR`:

```bash
MFINANCE_DATA_DIR=/ruta/a/carpeta pnpm tauri dev
```

## Descargar

La versión más reciente está en
[GitHub Releases](https://github.com/MoiBaldenegro/mfinance/releases/latest).
Hay instaladores **NSIS** y **MSI** para Windows 10/11.

La app revisa actualizaciones al arrancar y te avisa cuando hay una versión
nueva. No necesitas buscar el instalador a mano.

## Stack

- **Tauri 2** con backend en Rust.
- **React 19 + TypeScript + Vite** en la interfaz.
- **Chart.js** para las gráficas.
- Tests con `node:test` y `cargo test`.

## Desarrollo

Requisitos: Node 20+, pnpm, Rust estable y WebView2 (incluido en Windows 10/11).

| Comando | Qué hace |
| --- | --- |
| `pnpm install` | Instala dependencias. |
| `pnpm tauri dev` | Abre la app completa con recarga en caliente. |
| `pnpm check` | Tipos + tests JS + auditoría de tokens + tests Rust. |
| `pnpm tauri build` | Genera los instaladores en `src-tauri/target/release/bundle/`. |

## Arquitectura

Arquitectura hexagonal en ambos lados: el dominio no conoce React, Tauri ni la
persistencia; los adaptadores implementan los puertos y el composition root
decide qué se conecta con qué.

```
src/
  app/          composition root: qué adaptador implementa cada puerto
  domain/       entidades, puertos y casos de uso (TS puro, sin React/Tauri)
  adapters/     implementaciones de los puertos (IPC de Tauri, localStorage)
  components/   UI por sección; components/ui = piezas compartidas
  styles/       tokens.css + primitivas (styles/ui) + una hoja por sección
src-tauri/src/
  domain/ → application/ → infrastructure/ → commands/, composition root en lib.rs
tests/          node:test (dominio, arquitectura, integración de la UI)
```

Las reglas se verifican con los tests de `tests/arquitectura` y
`tests/sistema-diseno`. El detalle está en
[`docs/architecture.md`](docs/architecture.md).

## Enlaces

- [Landing](https://moibaldenegro.github.io/mfinance/)
- [Releases](https://github.com/MoiBaldenegro/mfinance/releases)
- [Arquitectura](docs/architecture.md)
- [Issues](https://github.com/MoiBaldenegro/mfinance/issues)

---

Hecho para tener el panorama claro: **tu dinero, en tu equipo y sin ruido**.
