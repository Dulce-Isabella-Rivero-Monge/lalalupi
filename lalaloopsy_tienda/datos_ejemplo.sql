-- Datos de ejemplo (ficticios) para probar la aplicación.

INSERT OR IGNORE INTO persona (cedula, nombre, apellido, correo, telefono) VALUES
  ('1-1111-1111', 'Lucía',   'Mora Vargas',    'lucia.mora@correo.cr',    '8888-1111'),
  ('2-2222-2222', 'Sofía',   'Rojas Jiménez',  'sofia.rojas@correo.cr',   '8888-2222'),
  ('3-3333-3333', 'Camila',  'Solano Arce',    'camila.solano@correo.cr', '8888-3333'),
  ('4-4444-4444', 'Daniela', 'Chaves Brenes',  'daniela.chaves@correo.cr','8888-4444'),
  ('5-5555-5555', 'Valeria', 'Campos Quesada', 'valeria.campos@correo.cr','8888-5555');

INSERT OR IGNORE INTO cliente (cedula, tipo) VALUES
  ('1-1111-1111', 'Coleccionista'),
  ('2-2222-2222', 'Regular'),
  ('3-3333-3333', 'Mayorista');

INSERT OR IGNORE INTO vendedor (cedula, especialidad, salario_x_hora) VALUES
  ('4-4444-4444', 'Muñecas grandes', 2800),
  ('5-5555-5555', 'Mini y Littles',  2600);

INSERT OR IGNORE INTO lalaloopsy (identificador, nombre, precio_x_unidad, foto, tipo) VALUES
  ('LL-G-001', 'Spot Splatter Splash',    24900, '', 'Grande'),
  ('LL-G-002', 'Crumbs Sugar Cookie',     24900, '', 'Grande'),
  ('LL-G-003', 'Jewel Sparkles',          26500, '', 'Grande'),
  ('LL-M-001', 'Mini Mittens Fluff',       7900, '', 'Mini'),
  ('LL-M-002', 'Mini Peanut Big Top',      7900, '', 'Mini'),
  ('LL-L-001', 'Little Pillow Featherbed',12500, '', 'Little'),
  ('LL-L-002', 'Little Dot Starlight',    12500, '', 'Little'),
  ('LL-S-001', 'Silly Hair Tippy',        19800, '', 'Silly Hair'),
  ('LL-S-002', 'Silly Hair Rosy',         19800, '', 'Silly Hair'),
  ('LL-P-001', 'Loopy Hair Bea',          21500, '', 'Loopy Hair');

INSERT OR IGNORE INTO factura
  (identificador, fecha, monto_total, cantidad_horas_trabajo, vehiculo_atendido, atendido_por) VALUES
  ('F-0001', '2026-10-12', 49800, 1.5, 'Moto de reparto 01', '4-4444-4444'),
  ('F-0002', '2026-10-20', 20400, 1.0, 'Auto de reparto 02', '5-5555-5555'),
  ('F-0003', '2026-10-27', 26500, 0.5, 'Moto de reparto 01', '4-4444-4444');
