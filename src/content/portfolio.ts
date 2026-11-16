// Portadas, trabajos recientes y fotos del sitio (specs/005-portadas-y-fotos-del-sitio). Solo
// se importa desde código de servidor: consulta la base.

import { connection } from "next/server";
import { db } from "@/lib/db";
import type { Foto, UsoSitio } from "@/lib/fotos";
import { armarRecientes, MAXIMO_RECIENTES } from "@/lib/recientes";
import { altDeCategoria, getCategorias, site, type Categoria } from "./site";

type FilaFoto = Foto & { destino: string };

async function fotosDelPortfolio(): Promise<FilaFoto[]> {
  return [
    ...(await db()<FilaFoto[]>`
      SELECT destino, id, ruta, width, height, thumbhash, alt, posicion FROM fotos
      WHERE destino LIKE 'portfolio/%' AND estado = 'lista'
      ORDER BY destino, posicion`),
  ];
}

// Las marcas de recientes en orden, solo las que todavía tienen foto (research R1).
async function marcas(): Promise<{ destino: string; id: string }[]> {
  return [
    ...(await db()<{ destino: string; id: string }[]>`
      SELECT r.destino, r.id FROM recientes r
      JOIN fotos f ON f.destino = r.destino AND f.id = r.id AND f.estado = 'lista'
      ORDER BY r.posicion`),
  ];
}

function sinDestino({ destino: _, ...foto }: FilaFoto): Foto {
  return foto;
}

function conAlt(foto: FilaFoto, nombres: Map<string, string>): FilaFoto {
  return foto.alt ? foto : { ...foto, alt: altDeCategoria(nombres.get(foto.destino) ?? "") };
}

// "Trabajos recientes": las marcadas primero y la mezcla hasta 12 (FR-006, FR-007).
export async function getRecientes(): Promise<Foto[]> {
  await connection();
  const [categorias, fotos, marcadas] = await Promise.all([getCategorias(), fotosDelPortfolio(), marcas()]);
  const nombres = new Map(categorias.map((c) => [`portfolio/${c.slug}`, c.nombre]));
  const porRuta = new Map(fotos.map((f) => [f.ruta, conAlt(f, nombres)]));
  const elegidas = marcadas.map((m) => porRuta.get(`${m.destino}/${m.id}`)!).filter(Boolean);
  const mezcla = armarRecientes(
    elegidas,
    categorias.map((c) => ({
      fotos: fotos.filter((f) => f.destino === `portfolio/${c.slug}`).map((f) => porRuta.get(f.ruta)!),
      portada: c.portada?.ruta ?? null,
    })),
  );
  return mezcla.map(sinDestino);
}

// La foto de Romi de la portada o de Sobre mí; null si no se subió (FR-009 a FR-011).
export async function getFotoSitio(uso: UsoSitio): Promise<Foto | null> {
  await connection();
  const [foto] = await db()<Foto[]>`
    SELECT id, ruta, width, height, thumbhash, alt, posicion FROM fotos
    WHERE destino = ${`sitio/${uso}`} AND estado = 'lista'
    ORDER BY posicion LIMIT 1`;
  return foto ? { ...foto, alt: foto.alt || `Romi, fotógrafa de ${site.nombre}` } : null;
}

// ---------- Panel (contracts/panel-portfolio.md) ----------

export type CategoriaPanel = Categoria & { cantidad: number; elegida: boolean };

export async function listarCategoriasPanel(): Promise<CategoriaPanel[]> {
  await connection();
  const [categorias, datos] = await Promise.all([
    getCategorias(),
    db()<{ slug: string; cantidad: number; portada: string | null }[]>`
      SELECT c.slug, c.portada,
             (SELECT count(*)::int FROM fotos f
              WHERE f.destino = 'portfolio/' || c.slug AND f.estado = 'lista') AS cantidad
      FROM categorias c`,
  ]);
  const porSlug = new Map(datos.map((d) => [d.slug, d]));
  return categorias.map((c) => {
    const d = porSlug.get(c.slug);
    return { ...c, cantidad: d?.cantidad ?? 0, elegida: !!d?.portada && d.portada === c.portada?.id };
  });
}

export type FotoPanel = Foto & { esPortada: boolean; esReciente: boolean };

export async function fotosDeCategoria(slug: string): Promise<{ categoria: CategoriaPanel; fotos: FotoPanel[] } | null> {
  const categoria = (await listarCategoriasPanel()).find((c) => c.slug === slug);
  if (!categoria) return null;
  const destino = `portfolio/${slug}`;
  const fotos = await db()<(Foto & { reciente: boolean })[]>`
    SELECT f.id, f.ruta, f.width, f.height, f.thumbhash, f.alt, f.posicion,
           (r.id IS NOT NULL) AS reciente
    FROM fotos f
    LEFT JOIN recientes r ON r.destino = f.destino AND r.id = f.id
    WHERE f.destino = ${destino} AND f.estado = 'lista'
    ORDER BY f.posicion`;
  return {
    categoria,
    fotos: fotos.map(({ reciente, ...f }) => ({
      ...f,
      alt: f.alt || altDeCategoria(categoria.nombre),
      esPortada: categoria.portada?.id === f.id,
      esReciente: reciente,
    })),
  };
}

export type RecientePanel = Foto & { destino: string; categoria: string };

// Las marcadas por Romi, en orden, y cuántas completa la mezcla automática.
export async function recientesPanel(): Promise<{ marcadas: RecientePanel[]; completa: number }> {
  await connection();
  const [categorias, fotos, marcadas] = await Promise.all([getCategorias(), fotosDelPortfolio(), marcas()]);
  const nombres = new Map(categorias.map((c) => [`portfolio/${c.slug}`, c.nombre]));
  const porRuta = new Map(fotos.map((f) => [f.ruta, f]));
  const lista = marcadas
    .map((m) => porRuta.get(`${m.destino}/${m.id}`))
    .filter((f): f is FilaFoto => !!f)
    .map((f) => ({ ...conAlt(f, nombres), categoria: nombres.get(f.destino) ?? "" }));
  const disponibles = fotos.length - lista.length;
  return { marcadas: lista, completa: Math.max(0, Math.min(MAXIMO_RECIENTES - lista.length, disponibles)) };
}
