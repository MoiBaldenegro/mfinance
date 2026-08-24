// Transporte de archivos para la subida de comprobantes (design.md F12):
// File → bytes → cadena base64 por chunks. Leer bytes NO es parsear:
// el análisis íntegro ocurre en el backend Rust.

const CHUNK = 0x8000;

/** Codifica un archivo elegido con el input nativo como base64. */
export async function archivoABase64(archivo: File): Promise<string> {
  const buffer = await archivo.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binario = '';
  for (let inicio = 0; inicio < bytes.length; inicio += CHUNK) {
    binario += String.fromCharCode(
      ...bytes.subarray(inicio, inicio + CHUNK),
    );
  }
  return btoa(binario);
}
