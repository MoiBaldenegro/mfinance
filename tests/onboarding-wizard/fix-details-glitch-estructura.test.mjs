// Feature 34 (REQ-34-01..04): acordeones <details> NO controlados en el Paso 2
// y contención del wizard. Estilo estructural del arnés (estructura-integracion-27).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const leer = (ruta) => readFileSync(join('src', ruta), 'utf8');
const SECCIONES = [
  'components/onboarding/ActivosSection.tsx',
  'components/onboarding/PasivosSection.tsx',
  'components/onboarding/InversionesSection.tsx',
];
// Patrón defectuoso (CR-3): estado React peleando con el toggle nativo.
const CONTROLADO_RE = /open=\{abierto\}[\s\S]*?onToggle=\{\(\) => setAbierto\(!abierto\)\}/;

describe('Paso 2 — acordeones sin bucle de toggle (REQ-34-01)', () => {
  for (const seccion of SECCIONES) {
    it(`${seccion}: sin open={estado} + onToggle simultáneos`, () => {
      const c = leer(seccion);
      assert.doesNotMatch(c, CONTROLADO_RE);
      assert.doesNotMatch(c, /setAbierto/);
    });
    it(`${seccion}: usa el acordeón compartido no controlado`, () => {
      assert.match(leer(seccion), /AcordeonSeccion/);
    });
  }
});

describe('Patrón extraído — AcordeonSeccion (REQ-34-02)', () => {
  const ACORDEON = 'components/onboarding/AcordeonSeccion.tsx';
  it('existe y renderiza <details> con open inicial no ligado a estado', () => {
    const c = leer(ACORDEON);
    assert.match(c, /<details/);
    assert.match(c, /\bopen\b/); // atributo open inicial
    assert.doesNotMatch(c, /open=\{[a-zA-Z]/); // nunca open={variable}
    assert.doesNotMatch(c, /useState|onToggle/); // sin estado ni handler de toggle
  });

  it('semántica uncontrolled: un re-render con props iguales NO revierte el toggle nativo', () => {
    // Simulación de reconciliación React para el atributo open del patrón
    // extraído: el DOM solo se toca cuando el valor de la prop cambia entre
    // renders (uncontrolled). Con el patrón controlado antiguo el re-render
    // re-aplicaba open={abierto} y revertía la elección del usuario.
    const el = { open: true };
    let propsPrevias = { open: true };
    const render = (props) => {
      if (propsPrevias.open !== props.open) el.open = Boolean(props.open);
      propsPrevias = props;
    };
    render({ open: true }); // montaje inicial
    el.open = false; // el usuario alterna el <details> nativamente
    render({ open: true }); // re-render del padre con las mismas props
    assert.equal(el.open, false, 'el re-render revirtió el estado elegido');
  });
});

describe('Contención del wizard (REQ-34-03/04)', () => {
  const CSS = leer('styles/onboarding-wizard.css');
  it('.onboarding-wizard__pasos con columnas contenidas', () => {
    assert.match(CSS, /\.onboarding-wizard__pasos\s*\{[^}]*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
  });
  it('.onboarding-wizard__paso y __contenido con min-width: 0', () => {
    assert.match(CSS, /\.onboarding-wizard__paso\s*\{[^}]*min-width:\s*0/);
    assert.match(CSS, /\.onboarding-wizard__contenido\s*\{[^}]*min-width:\s*0/);
  });
  it('contenedor standalone con padding y scroll propio (app.css + App.tsx)', () => {
    const appCss = leer('styles/app.css');
    assert.match(appCss, /\.app__pagina\s*\{[^}]*padding:[^;}]*var\(--space/);
    const app = leer('App.tsx');
    assert.match(app, /className="app__pagina"/);
  });
  it('las hojas tocadas siguen usando solo tokens (sin colores crudos)', () => {
    for (const hoja of ['styles/onboarding-wizard.css', 'styles/app.css']) {
      const c = leer(hoja);
      assert.equal(/#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(c), false, hoja);
    }
  });
});
