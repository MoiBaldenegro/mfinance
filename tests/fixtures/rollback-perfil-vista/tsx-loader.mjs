import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, extname, resolve as resolvePath } from 'node:path';
import ts from 'typescript';

const extensiones = ['.ts', '.tsx', '.js', '.mjs'];

export async function resolve(specifier, contexto, siguiente) {
  if (!specifier.startsWith('.') || !contexto.parentURL) return siguiente(specifier, contexto);
  const base = resolvePath(dirname(fileURLToPath(contexto.parentURL)), specifier);
  for (const ext of ['', ...extensiones, '.css']) {
    try { await readFile(base + ext); return { url: pathToFileURL(base + ext).href, shortCircuit: true }; } catch {}
  }
  return siguiente(specifier, contexto);
}

export async function load(url, contexto, siguiente) {
  const extension = extname(new URL(url).pathname);
  if (extension === '.css') return { format: 'module', source: 'export default {};', shortCircuit: true };
  if (extension !== '.ts' && extension !== '.tsx') return siguiente(url, contexto);
  const source = await readFile(fileURLToPath(url), 'utf8');
  const resultado = ts.transpileModule(source, { compilerOptions: {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext,
    jsx: ts.JsxEmit.ReactJSX, moduleResolution: ts.ModuleResolutionKind.Bundler,
  } });
  return { format: 'module', source: resultado.outputText, shortCircuit: true };
}
