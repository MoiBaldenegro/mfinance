// REQ-31-05/06 y REQ-32-05: contrato IPC frontend↔backend — cada invoke de
// src/adapters envía EXACTAMENTE las claves que espera su #[tauri::command]
// en camelCase (por defecto en Tauri 2); pnpm test falla antes de abrir la app.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const camel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());

/** Subcadena equilibrada desde el delimitador en `inicio` hasta su pareja. */
function bloque(fuente, inicio, abre, cierra) {
  let prof = 0;
  for (let i = inicio; i < fuente.length; i += 1) {
    if (fuente[i] === abre) prof += 1;
    else if (fuente[i] === cierra) { prof -= 1; if (prof === 0) return fuente.slice(inicio, i + 1); }
  }
  throw new Error(`bloque sin cerrar desde la posición ${inicio}`);
}

/** Commands del backend: nombre → claves JS esperadas (camelCase). */
function comandosDelBackend() {
  const dir = join('src-tauri', 'src', 'commands');
  const mapa = new Map();
  const re = /#\[tauri::command([^\]]*)\]\s*(?:\/\/[^\n]*\s*)*pub\s+(?:async\s+)?fn\s+([a-z0-9_]+)\s*\(/g;
  for (const archivo of readdirSync(dir).filter((n) => n.endsWith('.rs'))) {
    const fuente = readFileSync(join(dir, archivo), 'utf8');
    for (const m of fuente.matchAll(re)) {
      const convertir = /rename_all\s*=\s*"snake_case"/.test(m[1]) ? (s) => s : camel;
      const params = bloque(fuente, m.index + m[0].length - 1, '(', ')').slice(1, -1);
      const claves = params.split(',').map((p) => p.trim())
        .filter((p) => p !== '' && !p.includes('State<'))
        .map((p) => convertir(p.split(':')[0].trim()));
      mapa.set(m[2], claves);
    }
  }
  return mapa;
}

/** Claves de primer nivel de un objeto literal (ignora valores anidados). */
function clavesDeObjeto(objeto) {
  const claves = [];
  let prof = 0; let esperaClave = true;
  for (let i = 0; i < objeto.length; i += 1) {
    const ch = objeto[i];
    if ('{[('.includes(ch)) { prof += 1; continue; }
    if ('}])'.includes(ch)) { prof -= 1; continue; }
    if (prof !== 1 || /\s/.test(ch)) continue;
    if (ch === ',') { esperaClave = true; continue; }
    if (esperaClave && /[A-Za-z_$]/.test(ch)) claves.push(/^[\w$]+/.exec(objeto.slice(i))[0]);
    esperaClave = false;
  }
  return claves;
}

/** Invocaciones de src/adapters: comando y claves de payload enviadas. */
function invocacionesDeAdapters() {
  const dir = join('src', 'adapters');
  const re = /\b(?:llamar|invoke)\s*(?:<[^>]*>)?\(\s*'([a-z0-9_]+)'\s*(\)|,)/g;
  const salida = [];
  for (const archivo of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
    const fuente = readFileSync(join(dir, archivo), 'utf8');
    for (const m of fuente.matchAll(re)) {
      let claves = [];
      if (m[2] === ',') claves = clavesDeObjeto(bloque(fuente, fuente.indexOf('{', m.index + m[0].length), '{', '}'));
      salida.push({ archivo, comando: m[1], claves });
    }
  }
  return salida;
}

const COMMANDS_ONBOARDING = ['obtener_onboarding_status', 'actualizar_perfil_onboarding', 'completar_onboarding', 'agregar_meta', 'actualizar_meta', 'eliminar_meta'];
// Commands de Balance restaurados por la feature 32 (ya validados aquí):
const COMMANDS_BALANCE = ['asset_upsert', 'asset_eliminar', 'liability_upsert', 'liability_eliminar'];
describe('Contrato IPC adapters ↔ #[tauri::command] (REQ-31-05/06 y REQ-32-05)', () => {
  const comandos = comandosDelBackend();
  const invocaciones = invocacionesDeAdapters();
  const clavesDe = (c) => invocaciones.filter((i) => i.comando === c).flatMap((i) => i.claves);
  it('los commands de onboarding metas y Balance existen en el backend', () => {
    for (const c of [...COMMANDS_ONBOARDING, ...COMMANDS_BALANCE]) {
      assert.ok(comandos.has(c), `falta el command ${c}`);
    }
  });
  it('cada invoke envía exactamente las claves que espera su command', () => {
    const sinBackend = [];
    for (const { archivo, comando, claves } of invocaciones) {
      if (!comandos.has(comando)) { sinBackend.push(comando); continue; }
      const esperadas = comandos.get(comando);
      assert.deepEqual([...claves].sort(), [...esperadas].sort(), `${archivo}: ${comando} envía [${claves}] pero espera [${esperadas}]`);
    }
    assert.deepEqual(sinBackend, [], 'hay invokes a commands inexistentes');
  });
  it('envían claves camelCase según Tauri por defecto (REQ-31-01/02 REQ-32-05)', () => {
    const exigir = (c, clave) => assert.ok(clavesDe(c).includes(clave), `${c} no envía ${clave}`);
    for (const c of COMMANDS_ONBOARDING) exigir(c, 'perfilId');
    for (const c of ['actualizar_meta', 'eliminar_meta']) exigir(c, 'metaId');
    for (const [c, clave] of [['asset_upsert', 'valorActual'], ['liability_upsert', 'saldoPendiente'], ['liability_upsert', 'tasaInteresAnual']]) exigir(c, clave);
  });
});
