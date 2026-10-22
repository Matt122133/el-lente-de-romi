# Contract: `npm run fotos`

```text
npm run fotos -- --carpeta <ruta> --destino <destino> [--subir] [--salida <ruta>]
```

| Flag | Obligatorio | Default | Qué hace |
|---|---|---|---|
| `--carpeta` | sí | — | Carpeta con los JPEG originales. No recorre subcarpetas. |
| `--destino` | sí | — | `portfolio/<categoria>` o `galerias/<slug>` (ver data-model). |
| `--subir` | no | apagado | Además de escribir local, sube a R2. |
| `--salida` | no | `salida/` | Carpeta local de derivadas (ignorada por git). |
| `--manifiestos` | no | `manifiestos/` | Carpeta de manifiestos (ignorada por git). `probar` la apunta a una carpeta temporal. |

Siempre escribe `<manifiestos>/<destino>.json`. Lo pisa entero: el manifiesto
es la foto completa de la carpeta.

## Variables de entorno (solo con `--subir`)

Se leen de `.env.local`. Los nombres están documentados en `.env.example` y
los valores nunca van al repo.

| Variable | Para qué |
|---|---|
| `R2_ACCOUNT_ID` | Endpoint `https://<id>.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | Token de R2 con escritura en los dos buckets |
| `R2_BUCKET` | Bucket público de derivadas |
| `R2_BUCKET_ORIGINALES` | Bucket privado de originales |

Si falta alguna, sale con código 1 **antes** de procesar nada y nombra cuál
falta.

## Salida por consola

Una línea por foto (`✓ 12/50`, o `↷ ya estaba` cuando no hizo falta subirla),
un aviso por archivo salteado, sea porque no es `.jpg`/`.jpeg` o porque está
roto (`⚠ archivo.ext: no es un JPEG válido`) y un
resumen final:

- cantidad de fotos procesadas, salteadas y duplicadas;
- cuánto pesa el lote en derivadas;
- cuánto tardó.

## Códigos de salida

- `0`: el lote terminó, aunque haya salteado archivos con aviso.
- `1`: error de uso, de configuración o de R2. Lo que ya se subió queda, y
  volver a correr completa lo que falta.
