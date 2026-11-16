// "Trabajos recientes" del inicio: primero las fotos que marcó Romi, después una mezcla
// repartida entre las categorías (research R5 de specs/005-portadas-y-fotos-del-sitio).
// Pura y sin imports del sitio: la prueba scripts/portfolio/probar.ts la corre con Node.

export const MAXIMO_RECIENTES = 12;

type ConRuta = { ruta: string };

export type CategoriaParaMezcla<F extends ConRuta> = {
  // En el orden de categorias.orden.
  fotos: F[];
  // La ruta de la foto que se ve en su tarjeta: no se repite abajo si hay otras.
  portada: string | null;
};

// Determinística: las mismas fotos de entrada dan siempre la misma salida (FR-007).
export function armarRecientes<F extends ConRuta>(
  marcadas: F[],
  categorias: CategoriaParaMezcla<F>[],
  total = MAXIMO_RECIENTES,
): F[] {
  const resultado = marcadas.slice(0, total);
  const usadas = new Set(resultado.map((f) => f.ruta));

  // Candidatas de cada categoría, en su orden. La portada se saltea salvo que sea la única:
  // así toda categoría con fotos aparece al menos una vez.
  const candidatas = categorias.map(({ fotos, portada }) => {
    const libres = fotos.filter((f) => !usadas.has(f.ruta));
    const sinPortada = libres.filter((f) => f.ruta !== portada);
    return sinPortada.length ? sinPortada : libres;
  });

  // Cupos: de a uno por categoría y por vuelta, hasta llenar o quedarse sin fotos.
  const cupos = candidatas.map(() => 0);
  let faltan = total - resultado.length;
  while (faltan > 0) {
    let asignadas = 0;
    for (let i = 0; i < candidatas.length && faltan > 0; i++) {
      if (cupos[i] < candidatas[i].length) {
        cupos[i]++;
        faltan--;
        asignadas++;
      }
    }
    if (asignadas === 0) break;
  }

  // Dentro de cada categoría, fotos espaciadas a lo largo de la sesión: las primeras de una
  // sesión suelen ser casi iguales.
  const elegidas = candidatas.map((fotos, i) =>
    Array.from({ length: cupos[i] }, (_, j) => fotos[Math.floor((j * fotos.length) / cupos[i])]),
  );

  // Alternadas: una de cada categoría por vuelta.
  const vueltas = Math.max(0, ...cupos);
  for (let v = 0; v < vueltas; v++) {
    for (const fotos of elegidas) if (v < fotos.length) resultado.push(fotos[v]);
  }
  return resultado;
}
