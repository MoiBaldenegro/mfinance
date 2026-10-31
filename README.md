# mfinance

Aplicación de escritorio de finanzas personales: registro mensual de
ingresos y gastos, PyG, balance y patrimonio, plan de deuda (Avalancha / Bola
de nieve) con simulador de créditos, inversiones con interés compuesto,
indicadores con semáforo, cierre mensual guiado, conciliación y lectura de
extractos PDF. Varios perfiles, tema oscuro/claro y moneda MXN/USD/EUR.

Stack: **Tauri 2** (backend Rust) + **React 19 + TypeScript** (Vite).

## Requisitos

- Node 20+ y pnpm
- Rust estable (`rustup`)
- Windows: WebView2 (incluido en Windows 10/11)

## Desarrollo

```bash
pnpm install
pnpm tauri dev      # app completa con recarga en caliente
pnpm check          # tipos + tests JS + auditoría de tokens + tests Rust
```

Los datos viven en `Documents/mfinance`. Para trabajar con otra carpeta (QA,
demos) sin tocar tus datos: `MFINANCE_DATA_DIR=/ruta/a/carpeta pnpm tauri dev`.

## Producción

```bash
pnpm tauri build    # instaladores en src-tauri/target/release/bundle/
```

## Estructura

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

Las reglas de arquitectura están en `docs/architecture.md` y se verifican
con tests (`tests/arquitectura`, `tests/sistema-diseno`).
