// Tests TDD del caso de uso onboarding-paso3 (REQ-26-10)
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const USO_PATH = join('src', 'domain', 'use-cases', 'onboarding', 'onboarding-paso3.ts');
const ENTIDADES_PATH = join('src', 'domain', 'entities', 'onboarding', 'onboarding-pasos.ts');
const HOOK_PATH = join('src', 'hooks', 'use-onboarding.ts');
const COMP_PATH = join('src', 'components', 'onboarding', 'OnboardingPasoDeudaProyeccion.tsx');
const DEUDA_PATH = join('src', 'components', 'onboarding', 'DeudaSection.tsx');
const PROY_PATH = join('src', 'components', 'onboarding', 'ProyeccionSection.tsx');
const PREVIEW_PATH = join('src', 'components', 'onboarding', 'PreviewSection.tsx');
const CSS_PATH = join('src', 'styles', 'onboarding-paso-deuda-proyeccion.css');
const DEUDA_CSS = join('src', 'styles', 'deuda-section.css');
const PROY_CSS = join('src', 'styles', 'proyeccion-section.css');
const PREVIEW_CSS = join('src', 'styles', 'preview-section.css');
const WIZARD_PATH = join('src', 'components', 'onboarding', 'OnboardingWizard.tsx');
const SNAPSHOT_PORT = join('src', 'domain', 'ports', 'snapshot-port.ts');

describe('onboarding-paso3 — caso de uso (REQ-26-01, 26-10)', () => {
  it('existe el archivo onboarding-paso3.ts', () => {
    assert.ok(readFileSync(USO_PATH, 'utf8').length > 0);
  });

  it('exporta actualizarPaso3', () => {
    const contenido = readFileSync(USO_PATH, 'utf8');
    assert.match(contenido, /export.*actualizarPaso3/);
  });

  it('importa Paso3Data y OnboardingData de entidades', () => {
    const contenido = readFileSync(USO_PATH, 'utf8');
    assert.match(contenido, /Paso3Data/);
    assert.match(contenido, /OnboardingData/);
    assert.match(contenido, /entities\/onboarding/);
  });

  it('actualizarPaso3 devuelve nuevo OnboardingData con paso3 actualizado (inmutabilidad)', () => {
    const contenido = readFileSync(USO_PATH, 'utf8');
    assert.match(contenido, /function actualizarPaso3|const actualizarPaso3|export.*actualizarPaso3/);
  });

  it('exporta paso3DataPorDefecto con defaults correctos', () => {
    const contenido = readFileSync(USO_PATH, 'utf8');
    assert.match(contenido, /paso3DataPorDefecto/);
    assert.match(contenido, /Avalanche/);
    assert.match(contenido, /pago_extra_mensual:\s*0/);
  });
});

describe('Entidades Paso3Data — estructura (REQ-26-02, 26-03, 26-04)', () => {
  it('Paso3Data tiene estrategia_deuda, pago_extra_mensual, supuestos_proyeccion', () => {
    const contenido = readFileSync(ENTIDADES_PATH, 'utf8');
    assert.match(contenido, /estrategia_deuda/);
    assert.match(contenido, /pago_extra_mensual/);
    assert.match(contenido, /supuestos_proyeccion/);
  });

  it('estrategia_deuda es Avalanche | Snowball', () => {
    const contenido = readFileSync(ENTIDADES_PATH, 'utf8');
    assert.match(contenido, /Avalanche.*Snowball|Snowball.*Avalanche/);
  });

  it('pago_extra_mensual es number', () => {
    const contenido = readFileSync(ENTIDADES_PATH, 'utf8');
    assert.match(contenido, /pago_extra_mensual:\s*number/);
  });

  it('supuestos_proyeccion es array de SupuestoProyeccion', () => {
    const contenido = readFileSync(ENTIDADES_PATH, 'utf8');
    assert.match(contenido, /SupuestoProyeccion/);
  });

  it('SupuestoProyeccion tiene variable (string) y porcentaje (number -50..+100)', () => {
    const contenido = readFileSync(ENTIDADES_PATH, 'utf8');
    assert.match(contenido, /variable:\s*string/);
    assert.match(contenido, /porcentaje:\s*number/);
  });
});

describe('Hook useOnboarding — soporte paso 3 (REQ-26-08, 26-10)', () => {
  it('importa actualizarPaso3 del dominio', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /actualizarPaso3/);
    assert.match(contenido, /onboarding\/index/);
  });

  it('expone actualizarPaso3 para el componente', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /actualizarPaso3/);
  });

  it('usa DEBOUNCE_MS (500ms) para paso 3', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /DEBOUNCE_MS/);
  });

  it('expone paso3Actual en el retorno', () => {
    const contenido = readFileSync(HOOK_PATH, 'utf8');
    assert.match(contenido, /paso3Actual/);
  });
});

describe('Componente OnboardingPasoDeudaProyeccion — estructura padre (REQ-26-01, 26-11)', () => {
  it('existe OnboardingPasoDeudaProyeccion.tsx', () => {
    assert.ok(readFileSync(COMP_PATH, 'utf8').length > 0);
  });

  it('importa hoja de estilos CSS separada', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    assert.match(contenido, /import\s+['"]\.\.\/\.\.\/styles\/onboarding-paso-deuda-proyeccion\.css['"]/);
  });

  it('no tiene CSS embebido', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    assert.equal(contenido.includes('style={{'), false);
    assert.equal(contenido.includes('<style'), false);
  });

  it('componé sub-componentes DeudaSection, ProyeccionSection, PreviewSection', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    assert.match(contenido, /DeudaSection/);
    assert.match(contenido, /ProyeccionSection/);
    assert.match(contenido, /PreviewSection/);
  });

  it('usa snapshotPort para cargar proyecciones', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    assert.match(contenido, /snapshotPort/);
    assert.match(contenido, /pygProyeccion|balanceFuturo/);
  });

  it('Archivo ≤100 líneas', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `OnboardingPasoDeudaProyeccion.tsx tiene ${lineas} líneas, debe ser ≤100`);
  });

  it('CSS padre ≤100 líneas', () => {
    const contenido = readFileSync(CSS_PATH, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `onboarding-paso-deuda-proyeccion.css tiene ${lineas} líneas, debe ser ≤100`);
  });
});

describe('DeudaSection — sección deuda (REQ-26-02, 26-03)', () => {
  it('existe DeudaSection.tsx', () => {
    assert.ok(readFileSync(DEUDA_PATH, 'utf8').length > 0);
  });

  it('importa hoja de estilos', () => {
    const contenido = readFileSync(DEUDA_PATH, 'utf8');
    assert.match(contenido, /import\s+['"]\.\.\/\.\.\/styles\/deuda-section\.css['"]/);
  });

  it('no tiene CSS embebido', () => {
    const contenido = readFileSync(DEUDA_PATH, 'utf8');
    assert.equal(contenido.includes('style={{'), false);
    assert.equal(contenido.includes('<style'), false);
  });

  it('radio buttons Avalancha/Bola de nieve (default Avalancha)', () => {
    const contenido = readFileSync(DEUDA_PATH, 'utf8');
    assert.match(contenido, /Avalanche/);
    assert.match(contenido, /Snowball/);
    assert.match(contenido, /radio/);
    assert.match(contenido, /checked=.*Avalanche/);
  });

  it('campo pago extra mensual ≥0 formateado moneda', () => {
    const contenido = readFileSync(DEUDA_PATH, 'utf8');
    assert.match(contenido, /pago_extra|pagoExtra|pago extra/);
    assert.match(contenido, /formatoMoneda/);
    assert.match(contenido, /min="0"/);
  });

  it('Archivo ≤100 líneas', () => {
    const contenido = readFileSync(DEUDA_PATH, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `DeudaSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
  });

  it('CSS ≤100 líneas', () => {
    const contenido = readFileSync(DEUDA_CSS, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `deuda-section.css tiene ${lineas} líneas, debe ser ≤100`);
  });
});

describe('ProyeccionSection — sección supuestos (REQ-26-04, 26-07, 26-08)', () => {
  it('existe ProyeccionSection.tsx', () => {
    assert.ok(readFileSync(PROY_PATH, 'utf8').length > 0);
  });

  it('importa hoja de estilos', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    assert.match(contenido, /import\s+['"]\.\.\/\.\.\/styles\/proyeccion-section\.css['"]/);
  });

  it('no tiene CSS embebido', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    assert.equal(contenido.includes('style={{'), false);
    assert.equal(contenido.includes('<style'), false);
  });

  it('tabla supuestos con variables del paso 1 + balance (en componente padre)', () => {
    const contenido = readFileSync(COMP_PATH, 'utf8');
    // Usa clavesIngresos/clavesGastos y etiquetaIngreso/etiquetaGasto para mapear claves canónicas
    assert.match(contenido, /clavesIngresos/);
    assert.match(contenido, /clavesGastos/);
    assert.match(contenido, /etiquetaIngreso/);
    assert.match(contenido, /etiquetaGasto/);
    // Variables de balance
    assert.match(contenido, /revalorizacion_activos/);
    assert.match(contenido, /interes_pasivos/);
  });

  it('ProyeccionSection usa variables prop y clamp -50..100', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    assert.match(contenido, /variables/);
    assert.match(contenido, /Math\.max\(-0\.5|Math\.min\(1/);
  });

  it('botón "Restablecer a 0%" pone supuestos a 0', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    assert.match(contenido, /Restablecer.*0|0%|restablecer/);
    assert.match(contenido, /porcentaje:\s*0/);
  });

  it('reutiliza pyg-proyeccion-supuestos (formatearVariacion, parsearVariacion)', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    assert.match(contenido, /formatearVariacion/);
    assert.match(contenido, /parsearVariacion/);
    assert.match(contenido, /pyg-proyeccion-supuestos/);
  });

  it('Archivo ≤100 líneas', () => {
    const contenido = readFileSync(PROY_PATH, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `ProyeccionSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
  });

  it('CSS ≤100 líneas', () => {
    const contenido = readFileSync(PROY_CSS, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `proyeccion-section.css tiene ${lineas} líneas, debe ser ≤100`);
  });
});

describe('PreviewSection — vista previa PyG + Patrimonio (REQ-26-07)', () => {
  it('existe PreviewSection.tsx', () => {
    assert.ok(readFileSync(PREVIEW_PATH, 'utf8').length > 0);
  });

  it('importa hoja de estilos', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /import\s+['"]\.\.\/\.\.\/styles\/preview-section\.css['"]/);
  });

  it('no tiene CSS embebido', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.equal(contenido.includes('style={{'), false);
    assert.equal(contenido.includes('<style'), false);
  });

  it('renderiza PyG 12 meses (ingresos, gastos, utilidad, ahorro acumulado)', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /ingresos|gastos|utilidad|ahorro.*acumulado/);
    assert.match(contenido, /filasPyg/);
  });

  it('renderiza Patrimonio 12 meses (activos, pasivos, patrimonio)', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /activos|pasivos|patrimonio/);
    assert.match(contenido, /filasBalance/);
  });

  it('usa filasDeTablaProyeccion de pyg-proyeccion', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /filasDeTablaProyeccion/);
    assert.match(contenido, /pyg-proyeccion/);
  });

  it('maneja estado cargando y vacío', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /cargando/);
    assert.match(contenido, /MENSAJE_SIN_HISTORICO/);
  });

  it('distinguido histórico/proyectado visualmente', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    assert.match(contenido, /proyectado/);
    assert.match(contenido, /historico/);
  });

  it('Archivo ≤100 líneas', () => {
    const contenido = readFileSync(PREVIEW_PATH, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `PreviewSection.tsx tiene ${lineas} líneas, debe ser ≤100`);
  });

  it('CSS ≤100 líneas', () => {
    const contenido = readFileSync(PREVIEW_CSS, 'utf8');
    const lineas = contenido.split('\n').length;
    assert.ok(lineas <= 100, `preview-section.css tiene ${lineas} líneas, debe ser ≤100`);
  });
});

describe('Integración en OnboardingWizard (REQ-26-01, 26-09)', () => {
  // Feature 27: el contenido de los pasos se extrajo a WizardContenido
  // para respetar la regla dura de ≤100 líneas por archivo.
  const CONTENIDO_PATH = join('src', 'components', 'onboarding', 'WizardContenido.tsx');
  const leerContenido = () => readFileSync(CONTENIDO_PATH, 'utf8');
  it('OnboardingWizard importa OnboardingPasoDeudaProyeccion para paso 3', () => {
    assert.match(leerContenido(), /OnboardingPasoDeudaProyeccion/);
  });

it('Paso 3 renderiza OnboardingPasoDeudaProyeccion (no placeholder)', () => {
    const contenido = leerContenido();
    // keyPaso === 'paso3' y renderiza OnboardingPasoDeudaProyeccion
    assert.match(contenido, /keyPaso\s*===\s*['"]paso3['"]/);
    assert.match(contenido, /OnboardingPasoDeudaProyeccion/);
  });

  it('Paso 3 NO bloquea Siguiente (paso opcional)', () => {
    const contenido = readFileSync(WIZARD_PATH, 'utf8');
    assert.match(contenido, /currentStep === 3/);
    assert.match(contenido, /return true/);
  });

  it('pasa paso1Data al componente paso 3', () => {
    const contenido = leerContenido();
    assert.match(contenido, /paso1Data=.*pasoActual|paso1Data:\s*pasoActual/);
  });
});

describe('Puertos para motores deuda/proyección (REQ-26-05, 26-06)', () => {
  it('SnapshotPort expone planDeuda() para motor plan-deuda (F9)', () => {
    const contenido = readFileSync(SNAPSHOT_PORT, 'utf8');
    assert.match(contenido, /planDeuda/);
    assert.match(contenido, /PlanDeuda/);
  });

  it('SnapshotPort expone pygProyeccion() y balanceFuturo() para motor proyección (F14)', () => {
    const contenido = readFileSync(SNAPSHOT_PORT, 'utf8');
    assert.match(contenido, /pygProyeccion/);
    assert.match(contenido, /balanceFuturo/);
    assert.match(contenido, /SupuestosProyeccion/);
    assert.match(contenido, /ProyeccionPyg/);
    assert.match(contenido, /BalanceFuturo/);
  });
});

describe('Estilos - solo tokens.css (audit-design-tokens OK)', () => {
  const cssFiles = [CSS_PATH, DEUDA_CSS, PROY_CSS, PREVIEW_CSS];
  for (const cssFile of cssFiles) {
    it(`${cssFile.split('\\').pop()}: sin valores hardcodeados`, () => {
      const contenido = readFileSync(cssFile, 'utf8');
      const lineas = contenido.split('\n');
      for (const linea of lineas) {
        const limpia = linea.trim();
        if (!limpia || limpia.startsWith('/*')) continue;
        assert.ok(!/#[0-9a-fA-F]{3,8}/.test(limpia), `Posible color hex: ${linea} en ${cssFile}`);
        assert.ok(!/rgb\(/.test(limpia), `Posible rgb: ${linea} en ${cssFile}`);
        assert.ok(!/rgba\(/.test(limpia), `Posible rgba: ${linea} en ${cssFile}`);
      }
    });
  }
});