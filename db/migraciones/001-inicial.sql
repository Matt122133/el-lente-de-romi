-- Contenido del sitio: categorías del portfolio, galerías de entrega y sus fotos.
-- Solo rutas y metadata, nunca bytes de imagen (principio III).
-- Modelo: specs/003-base-de-datos-railway/data-model.md.

CREATE TABLE categorias (
  slug        text PRIMARY KEY CHECK (slug ~ '^[a-z]+$'),
  nombre      text NOT NULL CHECK (nombre <> ''),
  descripcion text NOT NULL,
  orden       integer NOT NULL
);

CREATE TABLE galerias (
  slug       text PRIMARY KEY CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  titulo     text NOT NULL CHECK (titulo <> ''),
  fecha      date NOT NULL,
  -- Vence al terminar ese día, hora de Argentina.
  vence_el   date NOT NULL,
  -- scrypt$N$r$p$sal$hash (research R4). Nunca la clave en texto plano.
  clave_hash text NOT NULL CHECK (clave_hash LIKE 'scrypt$%')
);

-- El destino es portfolio/<categoria> o galerias/<slug>; sin FK porque apunta a dos
-- tablas: el script de subida verifica que exista antes de escribir (FR-015).
CREATE TABLE fotos (
  destino   text NOT NULL CHECK (destino ~ '^(portfolio/[a-z]+|galerias/[a-z0-9]+(-[a-z0-9]+)*)$'),
  id        text NOT NULL,
  ruta      text NOT NULL,
  width     integer NOT NULL CHECK (width > 0),
  height    integer NOT NULL CHECK (height > 0),
  thumbhash text NOT NULL,
  alt       text NOT NULL DEFAULT '',
  posicion  integer NOT NULL CHECK (posicion >= 0),
  PRIMARY KEY (destino, id)
);

CREATE INDEX fotos_por_destino ON fotos (destino, posicion);
