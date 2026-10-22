// npm run fotos -- --carpeta <ruta> --destino <destino> [--subir] [--salida <ruta>] [--manifiestos <ruta>]
//
// Toma una carpeta de JPEG, genera las derivadas de cada foto y deja el manifiesto que lee el
// sitio. Con --subir, además las sube a R2. Contrato: specs/002-fotos-reales/contracts/cli-fotos.md.

import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { parseArgs } from "node:util";
import { destinoValido, esGaleria, type Foto, type Manifiesto } from "../../src/lib/fotos.ts";
import { claveDerivada, claveOriginal, VARIANTES, type Formato, type Variante } from "../../src/lib/imagenes.ts";
import { nombreDeHash, PIPELINE, procesarFoto, type Derivada } from "./pipeline.ts";
import { buckets, clavesExistentes, subir, variablesFaltantes } from "./r2.ts";

const CACHE_DERIVADAS = "public, max-age=31536000, immutable";
const SUBIDAS_EN_PARALELO = 4;

function uso(mensaje: string): never {
  console.error(`✗ ${mensaje}`);
  console.error(
    "Uso: npm run fotos -- --carpeta <ruta> --destino <portfolio/<categoria>|galerias/<slug>> [--subir] [--salida <ruta>] [--manifiestos <ruta>]",
  );
  process.exit(1);
}

const { values: args } = parseArgs({
  options: {
    carpeta: { type: "string" },
    destino: { type: "string" },
    subir: { type: "boolean", default: false },
    salida: { type: "string", default: "salida" },
    manifiestos: { type: "string", default: "manifiestos" },
  },
});

if (!args.carpeta) uso("Falta --carpeta.");
if (!args.destino) uso("Falta --destino.");
const carpeta = args.carpeta;
const destino = args.destino.replace(/\/+$/, "");
if (!destinoValido(destino)) uso(`Destino inválido: ${destino}`);
if (!existsSync(carpeta)) uso(`No existe la carpeta: ${carpeta}`);

// Sin credenciales no se procesa nada: mejor fallar antes que a mitad del lote.
if (args.subir) {
  const faltan = variablesFaltantes();
  if (faltan.length) uso(`Faltan variables en .env.local: ${faltan.join(", ")}`);
}

const inicio = Date.now();
const rutaManifiesto = join(args.manifiestos, `${destino}.json`);
const conOriginal = esGaleria(destino);

// Orden natural: 2 antes que 10 (FR-015).
const orden = new Intl.Collator("es", { numeric: true, sensitivity: "base" });
const archivos = (await readdir(carpeta, { withFileTypes: true }))
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .sort(orden.compare);

const jpegs: string[] = [];
let salteadas = 0;
for (const nombre of archivos) {
  if ([".jpg", ".jpeg"].includes(extname(nombre).toLowerCase())) jpegs.push(nombre);
  else {
    console.warn(`⚠ ${nombre}: no es un JPEG, se saltea`);
    salteadas++;
  }
}

// Lo que ya se procesó en una corrida anterior se reutiliza sin volver a codificar.
const anteriores = new Map<string, Foto>();
if (existsSync(rutaManifiesto)) {
  const previo = JSON.parse(await readFile(rutaManifiesto, "utf8")) as Manifiesto;
  if (previo.pipeline === PIPELINE) for (const f of previo.fotos) anteriores.set(f.id, f);
}

const remotas = { publico: new Set<string>(), originales: new Set<string>() };
if (args.subir) {
  const b = buckets();
  const prefijo = `romi/${destino}/`;
  remotas.publico = await clavesExistentes(b.publico, prefijo);
  if (conOriginal) remotas.originales = await clavesExistentes(b.originales, prefijo);
}

async function enParalelo(tareas: Array<() => Promise<void>>) {
  const cola = [...tareas];
  await Promise.all(
    Array.from({ length: SUBIDAS_EN_PARALELO }, async () => {
      for (let t = cola.shift(); t; t = cola.shift()) await t();
    }),
  );
}

const fotos: Foto[] = [];
const vistas = new Set<string>();
let duplicadas = 0;
let bytesDerivadas = 0;

for (const [i, nombre] of jpegs.entries()) {
  const progreso = `${i + 1}/${jpegs.length}`;
  const original = await readFile(join(carpeta, nombre));
  const id = nombreDeHash(original);

  // Mismo contenido con otro nombre: queda el primero en orden natural.
  if (vistas.has(id)) {
    console.warn(`⚠ ${nombre}: es igual a otra foto del lote, se saltea`);
    duplicadas++;
    continue;
  }

  let foto = anteriores.get(id);
  let derivadas: Derivada[] | null = null;

  // Reutilizar la corrida anterior solo si sus derivadas siguen en la carpeta de salida.
  if (foto) {
    const claves = derivadasEsperadas(foto.ruta);
    if (claves.every((c) => existsSync(join(args.salida, c)))) {
      derivadas = await Promise.all(
        claves.map(async (clave) => ({
          clave,
          contentType: clave.endsWith(".avif") ? "image/avif" : "image/webp",
          bytes: await readFile(join(args.salida, clave)),
        })),
      );
    }
  }

  if (!foto || !derivadas) {
    try {
      const p = await procesarFoto(original, destino);
      foto = { ...p.foto, posicion: 0 };
      derivadas = p.derivadas;
    } catch (e) {
      console.warn(`⚠ ${nombre}: no es un JPEG válido (${(e as Error).message}), se saltea`);
      salteadas++;
      continue;
    }
    for (const d of derivadas) {
      const destinoLocal = join(args.salida, d.clave);
      await mkdir(dirname(destinoLocal), { recursive: true });
      await writeFile(destinoLocal, d.bytes);
    }
  }

  vistas.add(id);
  fotos.push({ ...foto, posicion: fotos.length });
  bytesDerivadas += derivadas.reduce((s, d) => s + d.bytes.length, 0);

  if (args.subir) {
    const b = buckets();
    const tareas: Array<() => Promise<void>> = derivadas
      .filter((d) => !remotas.publico.has(d.clave))
      .map((d) => () => subir(b.publico, d.clave, d.bytes, d.contentType, CACHE_DERIVADAS));
    // El original va tal cual, byte por byte (principio IV), y solo en galerías.
    const clave = claveOriginal(foto.ruta);
    if (conOriginal && !remotas.originales.has(clave)) {
      tareas.push(() => subir(b.originales, clave, original, "image/jpeg"));
    }
    if (tareas.length === 0) {
      console.log(`↷ ${progreso} ya estaba`);
      continue;
    }
    await enParalelo(tareas);
  }
  console.log(`✓ ${progreso}`);
}

const manifiesto: Manifiesto = {
  version: 1,
  pipeline: PIPELINE,
  destino,
  generado: new Date().toISOString(),
  fotos,
};
await mkdir(dirname(rutaManifiesto), { recursive: true });
await writeFile(rutaManifiesto, JSON.stringify(manifiesto, null, 2) + "\n");

const segundos = Math.round((Date.now() - inicio) / 1000);
console.log(
  `\n${fotos.length} fotos · ${salteadas} salteadas · ${duplicadas} duplicadas · ` +
    `${(bytesDerivadas / 1024 / 1024).toFixed(1)} MB en derivadas · ${segundos} s`,
);
console.log(`Manifiesto: ${rutaManifiesto}`);

function derivadasEsperadas(ruta: string): string[] {
  return (Object.keys(VARIANTES) as Variante[]).flatMap((v) =>
    (["avif", "webp"] as Formato[]).map((f) => claveDerivada(ruta, v, f)),
  );
}
