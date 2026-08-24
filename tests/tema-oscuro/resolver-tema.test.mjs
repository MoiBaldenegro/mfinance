// Suite F17 tema-oscuro-tokens (1/2): caso de uso puro resolver-tema
// (REQ-17-04) y alternancia oscuro↔claro del conmutador (REQ-17-02).
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  resolverTema,
  alternarTema,
} from '../../src/domain/use-cases/resolver-tema.ts';

describe('REQ-17-04: resolución de tema', () => {
  it('sin preferencia almacenada devuelve oscuro (default)', () => {
    assert.equal(resolverTema(null), 'oscuro');
    assert.equal(resolverTema(undefined), 'oscuro');
  });

  it('valor corrupto, vacío o desconocido devuelve oscuro', () => {
    for (const corrupta of ['', '   ', 'azul', 'Oscuro', 'CLARO', 'null', '1']) {
      assert.equal(resolverTema(corrupta), 'oscuro', `preferencia "${corrupta}"`);
    }
  });

  it("'claro' almacenado respeta la elección clara", () => {
    assert.equal(resolverTema('claro'), 'claro');
  });

  it("'oscuro' almacenado respeta la elección oscura", () => {
    assert.equal(resolverTema('oscuro'), 'oscuro');
  });
});

describe('REQ-17-02: alternancia del conmutador', () => {
  it('alterna oscuro→claro y claro→oscuro', () => {
    assert.equal(alternarTema('oscuro'), 'claro');
    assert.equal(alternarTema('claro'), 'oscuro');
  });

  it('la alternancia es una involución (dos vueltas = mismo tema)', () => {
    assert.equal(alternarTema(alternarTema('claro')), 'claro');
    assert.equal(alternarTema(alternarTema('oscuro')), 'oscuro');
  });
});
