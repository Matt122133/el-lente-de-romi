// R2 desde el sitio, solo para el panel de Romi (research R3 y R8 de specs/004-panel-de-romi).
// El sitio nunca mueve bytes de imagen (principio III): firma las URLs para que el navegador
// suba directo, completa o aborta las subidas y borra por clave. Solo se importa desde código
// de servidor: usa las credenciales de R2.

import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  DeleteObjectsCommand,
  ListMultipartUploadsCommand,
  ListObjectsV2Command,
  S3Client,
  UploadPartCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const TAMANO_PARTE = 8 * 1024 * 1024;
const VIGENCIA_URL_S = 15 * 60;

const global = globalThis as typeof globalThis & { __r2?: S3Client };

function r2(): S3Client {
  global.__r2 ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return global.__r2;
}

export function buckets() {
  return { publico: process.env.R2_BUCKET!, originales: process.env.R2_BUCKET_ORIGINALES! };
}

export function cantidadDePartes(tamano: number): number {
  return Math.max(1, Math.ceil(tamano / TAMANO_PARTE));
}

export async function empezarMultipart(bucket: string, clave: string): Promise<string> {
  const r = await r2().send(
    new CreateMultipartUploadCommand({ Bucket: bucket, Key: clave, ContentType: "image/jpeg" }),
  );
  if (!r.UploadId) throw new Error("R2 no devolvió UploadId");
  return r.UploadId;
}

export async function firmarPartes(
  bucket: string,
  clave: string,
  uploadId: string,
  partes: number,
): Promise<string[]> {
  return Promise.all(
    Array.from({ length: partes }, (_, i) =>
      getSignedUrl(
        r2(),
        new UploadPartCommand({ Bucket: bucket, Key: clave, UploadId: uploadId, PartNumber: i + 1 }),
        { expiresIn: VIGENCIA_URL_S },
      ),
    ),
  );
}

export async function completarMultipart(
  bucket: string,
  clave: string,
  uploadId: string,
  partes: Array<{ numero: number; etag: string }>,
): Promise<void> {
  await r2().send(
    new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: clave,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: [...partes]
          .sort((a, b) => a.numero - b.numero)
          .map((p) => ({ PartNumber: p.numero, ETag: p.etag })),
      },
    }),
  );
}

export async function abortarMultipart(bucket: string, clave: string, uploadId: string): Promise<void> {
  await r2().send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: clave, UploadId: uploadId }));
}

// Borra todo lo que hay bajo un prefijo, incluidas las subidas a medias (SC-004). Se puede
// repetir si se corta a mitad.
export async function borrarPrefijo(bucket: string, prefijo: string): Promise<number> {
  let borrados = 0;
  let token: string | undefined;
  do {
    const r = await r2().send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefijo, ContinuationToken: token, MaxKeys: 1000 }),
    );
    const claves = (r.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (claves.length) {
      await r2().send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: claves, Quiet: true } }));
      borrados += claves.length;
    }
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);

  const pendientes = await r2().send(new ListMultipartUploadsCommand({ Bucket: bucket, Prefix: prefijo }));
  for (const u of pendientes.Uploads ?? []) {
    if (u.Key && u.UploadId) await abortarMultipart(bucket, u.Key, u.UploadId);
  }
  return borrados;
}
