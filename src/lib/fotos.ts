// La forma de una foto y del manifiesto que deja el script de subida (scripts/fotos/).
// Sin imports: lo carga tanto el sitio como Node directo, sin bundler. En la feature 003
// cada Foto pasa a ser una fila de la base de datos.

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

// Categorías del portfolio. Es la misma lista que site.categorias; está repetida porque
// este archivo no puede importar nada.
const CATEGORIAS = ["social", "moda", "productos", "eventos"];

export function destinoValido(destino: string): boolean {
  const portfolio = /^portfolio\/([a-z]+)$/.exec(destino);
  if (portfolio) return CATEGORIAS.includes(portfolio[1]);
  return /^galerias\/[a-z0-9]+(-[a-z0-9]+)*$/.test(destino);
}

export function esGaleria(destino: string): boolean {
  return destino.startsWith("galerias/");
}
