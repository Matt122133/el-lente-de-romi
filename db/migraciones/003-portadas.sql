-- Portadas de categoría, trabajos recientes y fotos del sitio (las de Romi).
-- Modelo: specs/005-portadas-y-fotos-del-sitio/data-model.md.

-- Id de una foto de portfolio/<slug>; nulo = la primera. Sin FK: el script de subida borra y
-- vuelve a insertar las fotos de una categoría, y la misma foto vuelve con el mismo id
-- (research R1).
ALTER TABLE categorias ADD COLUMN portada text;

-- Las fotos que Romi marca para "Trabajos recientes", en orden. Sin FK por lo mismo: una
-- marca cuya foto ya no está se ignora al leer.
CREATE TABLE recientes (
  destino  text NOT NULL CHECK (destino ~ '^portfolio/[a-z]+$'),
  id       text NOT NULL,
  posicion integer NOT NULL CHECK (posicion >= 0),
  PRIMARY KEY (destino, id)
);

-- Las fotos de Romi viven en sitio/<uso> (research R2).
ALTER TABLE fotos DROP CONSTRAINT fotos_destino_check;
ALTER TABLE fotos ADD CONSTRAINT fotos_destino_check
  CHECK (destino ~ '^(portfolio/[a-z]+|sitio/[a-z]+|galerias/[a-z0-9]+(-[a-z0-9]+)*)$');
