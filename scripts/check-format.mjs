import { validateFeatureList } from './validate-feature-list.mjs';
import { validateProgress } from './validate-progress.mjs';
import { validateSpecs } from './validate-specs.mjs';
import { validateDependencies } from './validate-dependencies.mjs';

const errors = [
  ...validateFeatureList(process.env.FEATURE_LIST_PATH),
  ...validateProgress(),
  ...validateSpecs(),
  ...validateDependencies(),
];
// hot reload
if (errors.length > 0) {
  for (const error of errors) {
    console.error(`FORMATO ✘ ${error}`);
  }
  process.exit(1);
}

console.log('FORMATO ✔ feature_list.json, progress/current.md, specs/ y docs/dependencies.md correctos');
