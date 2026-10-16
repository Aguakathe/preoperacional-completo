-- =========================================================
--  Sistema Preoperacional de Motos (NCR Atleos)
--  Script de base de datos (MySQL 8 / MariaDB 10.6+)
--
--  NOTA: este script es OPCIONAL. Al desplegar la aplicación, Hibernate
--  crea la base "preoperacional" y todas las tablas automáticamente
--  (hibernate.hbm2ddl.auto=update), y AppInit crea los roles y los
--  usuarios de prueba (admin / 12345, usuario / 123456).
--  Úsalo si quieres crear el esquema a mano o revisarlo en Workbench.
-- =========================================================

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS preoperacional
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE preoperacional;

-- ---------- 1. Seguridad: usuario, rol, usuario_rol ----------
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario     BIGINT       NOT NULL AUTO_INCREMENT,
  username       VARCHAR(60)  NOT NULL,
  password_hash  VARCHAR(100) NOT NULL,          -- BCrypt
  nombre         VARCHAR(120) NULL,
  email          VARCHAR(120) NULL,
  estado         BIT(1)       NOT NULL,          -- 1 = activo
  fecha_creacion DATETIME(6)  NULL,
  PRIMARY KEY (id_usuario),
  CONSTRAINT uk_usuario_username UNIQUE (username)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS rol (
  id_rol      BIGINT       NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(30)  NOT NULL,             -- ADMIN | USUARIO
  descripcion VARCHAR(120) NULL,
  PRIMARY KEY (id_rol),
  CONSTRAINT uk_rol_nombre UNIQUE (nombre)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS usuario_rol (
  id         BIGINT NOT NULL AUTO_INCREMENT,
  id_usuario BIGINT NOT NULL,
  id_rol     BIGINT NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
  CONSTRAINT fk_usuario_rol_rol     FOREIGN KEY (id_rol)     REFERENCES rol (id_rol)
) ENGINE=InnoDB;

-- ---------- 2. preoperacionales (formulario diario, pasos 1-7) ----------
-- Valores: si | no  ·  buen_estado | mal_estado
CREATE TABLE IF NOT EXISTS preoperacionales (
  id_preoperacional          BIGINT       NOT NULL AUTO_INCREMENT,
  id_usuario                 BIGINT       NOT NULL,   -- quien lo envió
  fecha_envio                DATETIME(6)  NOT NULL,
  conoce_campana             VARCHAR(2)   NOT NULL,   -- paso 1
  qlid                       VARCHAR(30)  NOT NULL,   -- paso 2
  nombre_completo            VARCHAR(120) NOT NULL,
  placa_moto                 VARCHAR(6)   NOT NULL,   -- ABC12G
  kilometraje                INT          NOT NULL,
  documentacion_vigente      VARCHAR(12)  NOT NULL,   -- paso 3
  estado_general_vehiculo    VARCHAR(12)  NOT NULL,
  estado_sistemas_accesorios VARCHAR(12)  NOT NULL,
  elementos_mal_estado       VARCHAR(2)   NOT NULL,   -- paso 5
  documentacion_perfecta     BIT(1)       NULL,       -- paso 6 (si elementos_mal_estado = si)
  estado_general_perfecto    BIT(1)       NULL,
  estado_mecanico_perfecto   BIT(1)       NULL,
  estado_sistemas_perfecto   BIT(1)       NULL,
  confirmacion_insegura      VARCHAR(2)   NULL,       -- paso 7 (si elementos_mal_estado = no)
  confirmacion_inspeccion    VARCHAR(2)   NULL,
  apto_para_conducir         BIT(1)       NOT NULL,   -- 0 si alguna respuesta de salud fue "no"
  PRIMARY KEY (id_preoperacional),
  INDEX idx_preoperacionales_placa (placa_moto),
  CONSTRAINT fk_preoperacionales_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- Paso 4: certificación de salud (7 preguntas por preoperacional)
CREATE TABLE IF NOT EXISTS preoperacional_salud (
  id_respuesta      BIGINT       NOT NULL AUTO_INCREMENT,
  id_preoperacional BIGINT       NOT NULL,
  orden             INT          NOT NULL,
  pregunta          VARCHAR(300) NOT NULL,
  respuesta         VARCHAR(2)   NOT NULL,             -- si | no
  PRIMARY KEY (id_respuesta),
  CONSTRAINT fk_salud_preoperacional FOREIGN KEY (id_preoperacional) REFERENCES preoperacionales (id_preoperacional)
) ENGINE=InnoDB;

-- Paso 6: elementos que no cumplen
CREATE TABLE IF NOT EXISTS preoperacional_elementos (
  id_elemento       BIGINT       NOT NULL AUTO_INCREMENT,
  id_preoperacional BIGINT       NOT NULL,
  categoria         VARCHAR(20)  NOT NULL,             -- documentacion | estadoGeneral | estadoMecanico | estadoSistemas
  elemento          VARCHAR(120) NOT NULL,
  PRIMARY KEY (id_elemento),
  CONSTRAINT fk_elementos_preoperacional FOREIGN KEY (id_preoperacional) REFERENCES preoperacionales (id_preoperacional)
) ENGINE=InnoDB;

-- ---------- 3. Mantenimientos: inspecciones con fotos ----------
CREATE TABLE IF NOT EXISTS mantenimientos (
  id_mantenimiento BIGINT        NOT NULL AUTO_INCREMENT,
  placa            VARCHAR(6)    NOT NULL,
  kilometraje      INT           NOT NULL,
  fecha_inspeccion DATE          NOT NULL,
  inspector        VARCHAR(120)  NOT NULL,
  observaciones    VARCHAR(1000) NULL,
  id_usuario       BIGINT        NOT NULL,             -- creado por
  creado_en        DATETIME(6)   NOT NULL,
  PRIMARY KEY (id_mantenimiento),
  INDEX idx_mantenimientos_placa (placa),
  CONSTRAINT fk_mantenimientos_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- categoria: general | motor | llantas | frenos | luces | carroceria | interior | documentos
CREATE TABLE IF NOT EXISTS fotos (
  id_foto          BIGINT       NOT NULL AUTO_INCREMENT,
  id_mantenimiento BIGINT       NOT NULL,
  nombre           VARCHAR(255) NOT NULL,
  tipo             VARCHAR(50)  NOT NULL,              -- image/jpeg | image/png | image/webp
  tamano           BIGINT       NOT NULL,              -- bytes
  categoria        VARCHAR(20)  NOT NULL,
  creada_en        DATETIME(6)  NOT NULL,
  id_usuario       BIGINT       NOT NULL,              -- creada por
  datos            LONGBLOB     NOT NULL,              -- la imagen (máx. 10 MB)
  PRIMARY KEY (id_foto),
  INDEX idx_fotos_categoria (categoria),
  CONSTRAINT fk_fotos_mantenimiento FOREIGN KEY (id_mantenimiento) REFERENCES mantenimientos (id_mantenimiento),
  CONSTRAINT fk_fotos_usuario       FOREIGN KEY (id_usuario)       REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

-- ---------- 4. Gastos de mantenimiento ----------
-- tipo_gasto: preventivo | correctivo | repuestos | lubricantes | neumaticos | bateria | frenos | electrico | otro
-- forma_pago: efectivo | tarjeta_credito | tarjeta_debito | transferencia | cheque | otro
CREATE TABLE IF NOT EXISTS gastos_mantenimiento (
  id_gasto              BIGINT        NOT NULL AUTO_INCREMENT,
  placa                 VARCHAR(6)    NOT NULL,
  kilometraje           INT           NOT NULL,
  fecha_gasto           DATE          NOT NULL,
  tipo_gasto            VARCHAR(20)   NOT NULL,
  descripcion           VARCHAR(500)  NOT NULL,
  proveedor             VARCHAR(120)  NOT NULL,
  valor_gasto           DECIMAL(12,2) NOT NULL,
  forma_pago            VARCHAR(20)   NOT NULL,
  numero_factura        VARCHAR(60)   NULL,
  fecha_vencimiento     DATE          NULL,
  kilometraje_anterior  INT           NULL,
  proximo_mantenimiento INT           NULL,
  observaciones         VARCHAR(1000) NULL,
  id_usuario            BIGINT        NOT NULL,        -- creado por
  fecha_creacion        DATETIME(6)   NOT NULL,
  PRIMARY KEY (id_gasto),
  INDEX idx_gastos_placa (placa),
  CONSTRAINT fk_gastos_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS documentos_gasto (
  id_documento BIGINT       NOT NULL AUTO_INCREMENT,
  id_gasto     BIGINT       NOT NULL,
  nombre       VARCHAR(255) NOT NULL,
  tipo         VARCHAR(50)  NOT NULL,                  -- application/pdf | image/jpeg | image/png
  tamano       BIGINT       NOT NULL,
  datos        LONGBLOB     NOT NULL,                  -- el archivo (máx. 5 MB)
  PRIMARY KEY (id_documento),
  CONSTRAINT fk_documentos_gasto FOREIGN KEY (id_gasto) REFERENCES gastos_mantenimiento (id_gasto)
) ENGINE=InnoDB;

-- ---------- 5. Datos iniciales ----------
INSERT IGNORE INTO rol (nombre, descripcion) VALUES
  ('ADMIN',   'Administrador del sistema'),
  ('USUARIO', 'Conductor / usuario operativo');

-- Los usuarios admin / 12345 y usuario / 123456 los crea la aplicación al
-- primer arranque (AppInit), porque las contraseñas van cifradas con BCrypt.
