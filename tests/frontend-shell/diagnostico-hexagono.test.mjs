// Suite F12 (frontend, 4/4): reglas del hexágono de los archivos nuevos
// — invoke() exclusivo bajo src/adapters/ (REQ-12-09) y adapter IPC que
// apunta a los tres commands reconstruyendo errores nombrados
// (DiagnosticoIpcError con código del backend). El contrato funcional del
// puerto vive en diagnostico-puerto.test.mjs.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

describe('hexágono de los archivos de la feature 12', () => {
  const raiz = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const propios = [
    'src/domain/entities/diagnostico.ts',
    'src/domain/errors/diagnostico-errors.ts',
    'src/domain/ports/diagnostico-port.ts',
    'src/domain/use-cases/diagnostico-tabla.ts',
    'src/domain/use-cases/diagnostico-tabla-acciones.ts',
    'src/domain/use-cases/diagnostico-informe-resumen.ts',
    'src/components/diagnostico-section/DiagnosticoSection.tsx',
    'src/components/diagnostico-section/DiagnosticoSubida.tsx',
    'src/components/diagnostico-section/DiagnosticoTabla.tsx',
    'src/components/diagnostico-section/DiagnosticoInforme.tsx',
    'src/components/diagnostico-section/DiagnosticoFila.tsx',
    'src/components/diagnostico-section/use-diagnostico.ts',
  ];

  it('ningún archivo nuevo fuera de adapters usa invoke()', () => {
    const infracciones = propios.filter((relativo) =>
      /invoke\s*\(/.test(readFileSync(join(raiz, relativo), 'utf8')),
    );
    assert.deepEqual(infracciones, []);
  });

  it('el adapter mapea rechazos a DiagnosticoIpcError y apunta a los commands', () => {
    const adapter = readFileSync(
      join(raiz, 'src/adapters/diagnostico-ipc-adapter.ts'),
      'utf8',
    );
    for (const comando of [
      'subir_comprobantes_cmd',
      'diagnosticar_comprobantes_cmd',
      'confirmar_diagnostico_cmd',
    ]) {
      assert.ok(adapter.includes(`'${comando}'`), `falta ${comando}`);
    }
    assert.ok(
      adapter.includes('DiagnosticoIpcError'),
      'el adapter debe reconstruir el error nombrado',
    );
  });
});
