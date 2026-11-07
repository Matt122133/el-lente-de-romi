// Subida a Cloudflare R2 con la API S3 (research R6). Dos buckets: el público solo con
// derivadas y el privado con los originales de las galerías (research R5, sección 0 del
// doc). Las credenciales salen de .env.local, nunca del repo.

import { ListObjectsV2Command, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

const VARIABLES = [
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "R2_BUCKET_ORIGINALES",
] as const;

export function variablesFaltantes(): string[] {
  return VARIABLES.filter((v) => !process.env[v]);
}

export function buckets() {
  return { publico: process.env.R2_BUCKET!, originales: process.env.R2_BUCKET_ORIGINALES! };
}

let cliente: S3Client | null = null;

function r2(): S3Client {
  cliente ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return cliente;
}

// Una sola pasada por el prefijo en vez de un HEAD por archivo: así volver a correr un lote
// sube solo lo que falta (FR-008).
export async function clavesExistentes(bucket: string, prefijo: string): Promise<Set<string>> {
  const claves = new Set<string>();
  let token: string | undefined;
  do {
    const r = await r2().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefijo, ContinuationToken: token }),
    );
    for (const o of r.Contents ?? []) if (o.Key) claves.add(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return claves;
}

export async function subir(
  bucket: string,
  clave: string,
  bytes: Buffer,
  contentType: string,
  cacheControl?: string,
): Promise<void> {
  await r2().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: clave,
      Body: bytes,
      ContentType: contentType,
      CacheControl: cacheControl,
    }),
  );
}
