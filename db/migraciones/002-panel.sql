-- Panel de Romi: galerías creadas desde el navegador y fotos que procesa el worker.
-- Modelo: specs/004-panel-de-romi/data-model.md.

ALTER TABLE galerias
  ADD COLUMN creada        timestamptz NOT NULL DEFAULT now(),
  -- La cookie de acceso firma slug:version; cambiar la clave la invalida (research R7).
  ADD COLUMN clave_version integer NOT NULL DEFAULT 1;

-- Las fotos del script de la 002 entran ya listas: el default las cubre (research R9).
ALTER TABLE fotos
  ADD COLUMN estado   text NOT NULL DEFAULT 'lista'
    CHECK (estado IN ('subiendo', 'subida', 'procesando', 'lista', 'error')),
  -- Nombre del archivo en la compu de Romi, solo para ordenar (research R4).
  ADD COLUMN nombre   text,
  ADD COLUMN error    text,
  ADD COLUMN cambiada timestamptz NOT NULL DEFAULT now(),
  ALTER COLUMN width DROP NOT NULL,
  ALTER COLUMN height DROP NOT NULL,
  ALTER COLUMN thumbhash DROP NOT NULL,
  ADD CONSTRAINT fotos_lista_completa
    CHECK (estado <> 'lista' OR (width IS NOT NULL AND height IS NOT NULL AND thumbhash IS NOT NULL));

CREATE INDEX fotos_pendientes ON fotos (cambiada) WHERE estado IN ('subida', 'procesando');

CREATE TABLE intentos_login (
  ip    text NOT NULL,
  fecha timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX intentos_por_ip ON intentos_login (ip, fecha);
