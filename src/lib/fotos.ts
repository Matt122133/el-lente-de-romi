// La forma de una foto y del manifiesto que deja el script de subida (scripts/fotos/).
// Sin imports: lo carga tanto el sitio como Node directo, sin bundler. Cada Foto es una fila
// de la tabla fotos; el manifiesto queda como caché local del script (research R8 de la 003).

export type Foto = {
  // Nombre de hash del contenido (nunca secuencial, principio VI).
  id: string;
  // Ruta en R2 sin prefijo ni variante (ver lib/imagenes.ts).
  ruta: string;
  // Ancho y alto de la foto ya derecha (con la orientación EXIF aplicada).
  width: number;
  height: number;
  // Versión borrosa de ~30 caracteres para mostrar mientras carga. Null en las de mentira,
  // y es lo que distingue una foto real de una de mentira.
  thumbhash: string | null;
  alt: string;
  // Orden dentro del lote: el orden natural del nombre de archivo original.
  posicion: number;
};

export type Manifiesto = {
  version: 1;
  // Versión del pipeline que entró en el hash de los nombres.
  pipeline: string;
  destino: string;
  generado: string;
  fotos: Foto[];
};

// Solo el formato: que la categoría o la galería exista lo verifica la base al subir (FR-015
// de specs/003-base-de-datos-railway). Es el mismo CHECK de la tabla fotos.
export function destinoValido(destino: string): boolean {
  return /^(portfolio\/[a-z]+|galerias\/[a-z0-9]+(-[a-z0-9]+)*)$/.test(destino);
}

export function esGaleria(destino: string): boolean {
  return destino.startsWith("galerias/");
}
