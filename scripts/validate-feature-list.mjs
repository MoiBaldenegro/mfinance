import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DEFAULT_PATH = fileURLToPath(new URL('../feature_list.json', import.meta.url));

const isNonEmptyString = (value) => typeof value === 'string' && value.length > 0;

// FEATURE 19 — depends_on: array opcional de enteros cuyas ids deben existir en
// el backlog, sin auto-referencia ni ciclos (ausencia = []). Detector de ciclos
// con DFS, stdlib. >100 líneas: excepción documentada en docs/architecture.md §13 (aprobada en la feature 19).

function mensajeRecuperacion() {
  return 'feature_list.json no existe: crea un nuevo feature_list.json desde cero (esqueleto { project, description, rules, features } según el validador) y da de alta las features vía el rol spec_author, y vuelve a ejecutar ./init.sh.';
}

function cicloDeGrafo(features) {
  const deps = new Map(features.map((f) => [f.id, f.depends_on ?? []]));
  const enDfs = new Set();
  const fin = new Set();
  let ciclo = null;
  const dfs = (id, camino = []) => {
    if (ciclo !== null || fin.has(id)) return;
    if (enDfs.has(id)) ciclo = [...camino, id].join(' -> ');
    else {
      enDfs.add(id);
      for (const dep of deps.get(id) ?? []) dfs(dep, [...camino, id]);
      enDfs.delete(id);
      fin.add(id);
    }
  };
  for (const id of deps.keys()) dfs(id);
  return ciclo;
}

export function validateFeatureList(featureListPath = DEFAULT_PATH) {
  const errors = [];
  if (!existsSync(featureListPath)) return [mensajeRecuperacion()];
  const data = JSON.parse(readFileSync(featureListPath, 'utf8'));
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    errors.push('feature_list.json: debe ser un objeto con { project, description, rules, features }');
    return errors;
  }

  if (!isNonEmptyString(data.project)) {
    errors.push('feature_list.json: "project" debe ser un texto no vacío');
  }
  if (!isNonEmptyString(data.description)) {
    errors.push('feature_list.json: "description" debe ser un texto no vacío');
  }

  const rules = data.rules;
  if (typeof rules !== 'object' || rules === null) {
    errors.push('feature_list.json: falta el objeto "rules"');
    return errors;
  }
  if (typeof rules.one_feature_at_a_time !== 'boolean') {
    errors.push('feature_list.json: rules.one_feature_at_a_time debe ser boolean');
  }
  if (typeof rules.require_tests_to_close !== 'boolean') {
    errors.push('feature_list.json: rules.require_tests_to_close debe ser boolean');
  }
  if (
    !Array.isArray(rules.valid_status) ||
    rules.valid_status.length === 0 ||
    !rules.valid_status.every(isNonEmptyString)
  ) {
    errors.push('feature_list.json: rules.valid_status debe ser un array de textos');
  }

  if (!Array.isArray(data.features)) {
    errors.push('feature_list.json: "features" debe ser un array');
    return errors;
  }

  const validStatuses = Array.isArray(rules.valid_status) ? rules.valid_status : [];
  const ids = new Set();
  const validas = [];
  data.features.forEach((feature, index) => {
    if (typeof feature !== 'object' || feature === null) {
      errors.push(`feature_list.json: features[${index}] debe ser un objeto`);
      return;
    }
    if (typeof feature.id !== 'number' || !Number.isInteger(feature.id)) {
      errors.push(`feature_list.json: features[${index}].id debe ser un entero`);
    } else if (ids.has(feature.id)) {
      errors.push(`feature_list.json: features[${index}].id duplicado`);
    } else {
      ids.add(feature.id);
      validas.push(feature);
    }
    if (!isNonEmptyString(feature.name)) {
      errors.push(`feature_list.json: features[${index}].name debe ser un texto no vacío`);
    }
    if (!isNonEmptyString(feature.title)) {
      errors.push(`feature_list.json: features[${index}].title debe ser un texto no vacío`);
    }
    if (!isNonEmptyString(feature.description)) {
      errors.push(`feature_list.json: features[${index}].description debe ser un texto no vacío`);
    }
    if (
      !Array.isArray(feature.acceptance) ||
      feature.acceptance.length === 0 ||
      !feature.acceptance.every(isNonEmptyString)
    ) {
      errors.push(`feature_list.json: features[${index}].acceptance debe ser un array de textos no vacío`);
    }
    if (!validStatuses.includes(feature.status)) {
      errors.push(
        `feature_list.json: features[${index}].status inválido "${feature.status}" (válidos: ${validStatuses.join(', ')})`,
      );
    }

    const dependsOn = feature.depends_on;
    if (dependsOn === undefined) return;
    if (!Array.isArray(dependsOn) || !dependsOn.every((dep) => Number.isInteger(dep))) {
      errors.push(`feature_list.json: features[${index}].depends_on debe ser un array de enteros`);
      return;
    }
    if (dependsOn.includes(feature.id)) {
      errors.push(`feature_list.json: features[${index}].depends_on incluye su propio id (auto-referencia)`);
    }
  });

  for (const [index, feature] of data.features.entries()) {
    const dependsOn = feature?.depends_on;
    if (!Array.isArray(dependsOn)) continue;
    for (const dep of dependsOn) {
      if (!ids.has(dep)) errors.push(`feature_list.json: features[${index}].depends_on referencia el id inexistente ${dep}`);
    }
  }

  const ciclo = cicloDeGrafo(validas);
  if (ciclo !== null) {
    const inicio = data.features.findIndex((f) => f !== null && typeof f === 'object' && f.id === Number(ciclo.split(' -> ')[0]));
    errors.push(`feature_list.json: features[${inicio}].depends_on forma un ciclo de dependencias: ${ciclo}`);
  }

  return errors;
}