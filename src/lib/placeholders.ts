// Fotos de mentira para el skeleton. Tienen la misma forma que van a tener las reales
// (ancho y alto guardados en la DB, ver sección 6 del doc), así la grilla ya se calcula
// con proporciones reales y no hay que tocarla cuando lleguen las fotos.

export type Foto = {
  id: string;
  width: number;
  height: number;
  alt: string;
};

// Proporciones típicas de cámara: horizontales 3:2, verticales 2:3 y 4:5, alguna cuadrada.
const PROPORCIONES: Array<[number, number]> = [
  [3, 2],
  [2, 3],
  [3, 2],
  [4, 5],
  [3, 2],
  [2, 3],
  [1, 1],
  [16, 9],
];

// Generador determinístico: la misma semilla da siempre la misma grilla, así no cambia
// entre el render del servidor y el del navegador.
function aleatorio(semilla: string) {
  let h = 2166136261;
  for (let i = 0; i < semilla.length; i++) {
    h ^= semilla.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function fotosDeMentira(semilla: string, cantidad: number): Foto[] {
  const rand = aleatorio(semilla);
  return Array.from({ length: cantidad }, (_, i) => {
    const [w, h] = PROPORCIONES[Math.floor(rand() * PROPORCIONES.length)];
    return {
      id: `${semilla}-${i}`,
      width: w * 1000,
      height: h * 1000,
      alt: "",
    };
  });
}
