// npm run worker — genera las derivadas de las fotos que Romi sube desde el panel (research R5
// de specs/004-panel-de-romi). Corre en un servicio aparte de Railway, nunca en el servidor
// del sitio. Usa el mismo procesarFoto que el script de la 002: mismo color y mismos nombres.
//
// La app lo despierta con POST /procesar por la red privada; al recibirlo (o al arrancar) vacía
// la cola y queda quieto, así Railway lo puede dormir cuando no hay trabajo.

import { createServer } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { claveOriginal } from "../../src/lib/imagenes.ts";
import { conectar } from "../db/conexion.ts";
import { nombreDeHash, procesarFoto } from "../fotos/pipeline.ts";
import { bajar, buckets, CACHE_DERIVADAS, subir, variablesFaltantes } from "../fotos/r2.ts";
import { liberarColgadas, marcarError, marcarLista, tomarSiguiente, type Trabajo } from "./cola.ts";

const faltan = variablesFaltantes();
if (!process.env.WORKER_SECRETO) faltan.push("WORKER_SECRETO");
if (faltan.length) {
  console.error(`✗ Faltan variables: ${faltan.join(", ")}`);
  process.exit(1);
}

const sql = conectar();
const SECRETO = Buffer.from(`Bearer ${process.env.WORKER_SECRETO}`);

async function procesar(t: Trabajo): Promise<void> {
  const b = buckets();
  const original = await bajar(b.originales, claveOriginal(t.ruta));
  // El id es el hash del contenido: si no coincide, el archivo llegó distinto (principio IV).
  if (nombreDeHash(original) !== t.id) throw new Error("El original en R2 no coincide con el subido");
  const { foto, derivadas } = await procesarFoto(original, t.destino);
  // Las 8 en paralelo: de a una, la subida pesaba tanto como generar las derivadas.
  await Promise.all(derivadas.map((d) => subir(b.publico, d.clave, d.bytes, d.contentType, CACHE_DERIVADAS)));
  await marcarLista(sql, t, { width: foto.width, height: foto.height, thumbhash: foto.thumbhash! });
}

// Una sola vuelta a la vez; si llega otro aviso mientras tanto, se da una vuelta más al final.
let vaciando = false;
let otraVuelta = false;

async function vaciarCola(): Promise<void> {
  if (vaciando) {
    otraVuelta = true;
    return;
  }
  vaciando = true;
  try {
    do {
      otraVuelta = false;
      const liberadas = await liberarColgadas(sql);
      if (liberadas) console.log(`↻ ${liberadas} fotos colgadas vuelven a la cola`);
      for (let t = await tomarSiguiente(sql); t; t = await tomarSiguiente(sql)) {
        const inicio = Date.now();
        try {
          await procesar(t);
          console.log(`✓ ${t.destino}/${t.id} en ${Date.now() - inicio} ms`);
        } catch (e) {
          const mensaje = (e as Error).message;
          console.error(`✗ ${t.destino}/${t.id}: ${mensaje}`);
          await marcarError(sql, t, mensaje);
        }
      }
    } while (otraVuelta);
  } catch (e) {
    console.error(`✗ cola: ${(e as Error).message}`);
  } finally {
    vaciando = false;
  }
}

function autorizado(header: string | undefined): boolean {
  const dado = Buffer.from(header ?? "");
  return dado.length === SECRETO.length && timingSafeEqual(dado, SECRETO);
}

const servidor = createServer((req, res) => {
  if (req.method === "POST" && req.url === "/procesar") {
    if (!autorizado(req.headers.authorization)) {
      res.writeHead(401).end();
      return;
    }
    res.writeHead(202).end();
    void vaciarCola();
    return;
  }
  if (req.method === "GET" && req.url === "/salud") {
    res.writeHead(200).end("ok");
    return;
  }
  res.writeHead(404).end();
});

const puerto = Number(process.env.PORT ?? 8080);
// "::" escucha en IPv6 y IPv4: la red privada de Railway es IPv6.
servidor.listen(puerto, "::", () => {
  console.log(`Worker escuchando en ${puerto}`);
  void vaciarCola();
});
