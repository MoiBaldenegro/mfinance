// Constantes y ayudas compartidas por las suites F18 refino-visual
// (precedente review_17: constantes exportadas para no duplicarlas).
// HOJAS_TOCADAS: hojas que la feature crea o edita (≤100 líneas y sin
// valores sueltos). CON_FOCUS_VISIBLE: shell + formularios principales
// que deben definir :focus-visible.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const STYLES = join(RAIZ, 'src', 'styles');
export const COMPONENTS = join(RAIZ, 'src', 'components');

export const leer = (...partes) => readFileSync(join(...partes), 'utf8');

export const HOJAS_TOCADAS = [
  'tokens.css',
  'estados-comunes.css',
  'section-tabs.css',
  'header-bar.css',
  'registro-section.css',
  'pyg-section.css',
  'balance-section.css',
  'deuda-section.css',
  'deuda-lista.css',
  'indicadores-section.css',
  'inversiones-section.css',
  'inversiones-tabla.css',
  'conciliacion-section.css',
  'wizard-cierre.css',
  'diagnostico-section.css',
  'ajustes-section.css',
  'campo-importe.css',
  'month-selector.css',
  'balance-forms.css',
  'movimiento-formulario.css',
  'simulador-formulario.css',
  'formulario-supuestos.css',
];

export const CON_FOCUS_VISIBLE = [
  'section-tabs.css',
  'header-bar.css',
  'campo-importe.css',
  'month-selector.css',
  'balance-forms.css',
  'movimiento-formulario.css',
  'simulador-formulario.css',
  'formulario-supuestos.css',
  'inversiones-tabla.css',
  'conciliacion-section.css',
  'wizard-cierre.css',
  'ajustes-section.css',
];
