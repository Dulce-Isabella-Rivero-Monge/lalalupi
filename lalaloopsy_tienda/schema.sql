-- Esquema de la tienda Lalaloopsy (basado en el diagrama de base de datos).
-- Se ejecuta automáticamente al iniciar la API y con crear_base_de_datos.py.

CREATE TABLE IF NOT EXISTS persona (
  cedula    TEXT PRIMARY KEY CHECK (length(cedula) BETWEEN 1 AND 30),
  nombre    TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 80),
  apellido  TEXT NOT NULL CHECK (length(apellido) BETWEEN 1 AND 100),
  correo    TEXT NOT NULL CHECK (length(correo) BETWEEN 3 AND 120),
  telefono  TEXT NOT NULL CHECK (length(telefono) BETWEEN 1 AND 30)
);

CREATE TABLE IF NOT EXISTS cliente (
  cedula  TEXT PRIMARY KEY,
  tipo    TEXT NOT NULL CHECK (length(tipo) BETWEEN 1 AND 40),
  FOREIGN KEY (cedula) REFERENCES persona (cedula) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS vendedor (
  cedula          TEXT PRIMARY KEY,
  especialidad    TEXT NOT NULL CHECK (length(especialidad) BETWEEN 1 AND 80),
  salario_x_hora  REAL NOT NULL CHECK (salario_x_hora >= 0),
  FOREIGN KEY (cedula) REFERENCES persona (cedula) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS lalaloopsy (
  identificador    TEXT PRIMARY KEY CHECK (length(identificador) BETWEEN 1 AND 30),
  nombre           TEXT NOT NULL CHECK (length(nombre) BETWEEN 1 AND 100),
  precio_x_unidad  REAL NOT NULL CHECK (precio_x_unidad >= 0),
  foto             TEXT NOT NULL DEFAULT '',
  tipo             TEXT NOT NULL CHECK (tipo IN ('Grande', 'Mini', 'Little', 'Silly Hair', 'Loopy Hair'))
);

CREATE TABLE IF NOT EXISTS factura (
  identificador           TEXT PRIMARY KEY CHECK (length(identificador) BETWEEN 1 AND 30),
  fecha                   TEXT NOT NULL,
  monto_total             REAL NOT NULL CHECK (monto_total >= 0),
  cantidad_horas_trabajo  REAL NOT NULL CHECK (cantidad_horas_trabajo >= 0),
  vehiculo_atendido       TEXT NOT NULL,
  atendido_por            TEXT NOT NULL,
  FOREIGN KEY (atendido_por) REFERENCES vendedor (cedula) ON DELETE RESTRICT
);
