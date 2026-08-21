import { readFileSync } from 'node:fs';

const CURRENT_PATH = new URL('../progress/current.md', import.meta.url);
const CURRENT_HEADER = '# Progreso actual';

export function validateProgress() {
  const errors = [];
  const content = readFileSync(CURRENT_PATH, 'utf8');

  if (content.length === 0) {
    errors.push('progress/current.md: el archivo está vacío');
    return errors;
  }
  if (!content.startsWith(CURRENT_HEADER)) {
    errors.push(`progress/current.md: debe empezar con "${CURRENT_HEADER}"`);
  }
  if (!content.includes('### Feature en curso')) {
    errors.push('progress/current.md: falta la sección "### Feature en curso"');
  }

  return errors;
}
