# 🧸 Tienda Lalaloopsy

Aplicación web para administrar una tienda de muñecas Lalaloopsy: **muñecas, personas, clientes, vendedores y facturas**.
Tiene un backend con **FastAPI + SQLite** y un frontend en **HTML, CSS y JavaScript** (sin frameworks), con estilo pastel de muñecas de trapo.

## Contenido del proyecto

```
lalaloopsy_tienda/
├── main.py                    # Backend: API REST (FastAPI)
├── database.py                # Conexión y creación de la base de datos
├── schema.sql                 # Esquema de las tablas (según el diagrama)
├── datos_ejemplo.sql          # Datos de ejemplo
├── crear_base_de_datos.py     # Script para crear o reiniciar la base de datos
├── lalaloopsy.db              # Base de datos SQLite (ya incluye datos de ejemplo)
├── requirements.txt           # Dependencias de Python
├── README.md
└── static/                    # Frontend
    ├── index.html
    ├── styles.css
    └── app.js
```

## Modelo de datos

Basado en el diagrama de la base de datos:

| Tabla        | Campos                                                                                               |
|--------------|------------------------------------------------------------------------------------------------------|
| `persona`    | **cedula** (PK), nombre, apellido, correo, telefono                                                  |
| `cliente`    | **cedula** (PK, FK → persona), tipo                                                                  |
| `vendedor`   | **cedula** (PK, FK → persona), especialidad, salario_x_hora                                          |
| `lalaloopsy` | **identificador** (PK), nombre, precio_x_unidad, foto, tipo (`Grande`, `Mini`, `Little`, `Silly Hair`, `Loopy Hair`) |
| `factura`    | **identificador** (PK), fecha, monto_total, cantidad_horas_trabajo, vehiculo_atendido, atendido_por (FK → vendedor) |

Las claves foráneas están activadas (`PRAGMA foreign_keys = ON`). No se puede borrar una persona que sea cliente o vendedor, ni un vendedor con facturas.

## Requisitos

- Python 3.10 o superior (probado con la versión 3.14 que usas en tu entorno)
- Un navegador moderno

## Instalación y ejecución

Desde la carpeta del proyecto, con tu entorno virtual (`venv`) activado:

**Windows (PowerShell)**
```powershell
venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

**macOS / Linux**
```bash
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Luego abre **http://127.0.0.1:8000** en el navegador.
La documentación interactiva de la API está en **http://127.0.0.1:8000/docs**.

## Base de datos

El archivo `lalaloopsy.db` ya viene creado con datos de ejemplo. Si lo borras, la API crea las tablas vacías al iniciar. Para recrearla manualmente:

```bash
python crear_base_de_datos.py --reiniciar --ejemplo   # borra todo y carga datos de ejemplo
python crear_base_de_datos.py --reiniciar             # borra todo y deja las tablas vacías
```

> Si tenías una versión anterior de `lalaloopsy.db` (con tablas separadas por tipo de muñeca), reemplázala por esta o ejecuta el comando con `--reiniciar`.

## API

Todas las rutas usan `{tabla}` = `persona`, `cliente`, `vendedor`, `lalaloopsy` o `factura`.

| Método   | Ruta                  | Descripción                         |
|----------|-----------------------|-------------------------------------|
| `GET`    | `/api/resumen`        | Cantidad de registros por tabla     |
| `GET`    | `/api/{tabla}`        | Lista todos los registros           |
| `GET`    | `/api/{tabla}/{clave}`| Obtiene un registro                 |
| `POST`   | `/api/{tabla}`        | Crea un registro                    |
| `PUT`    | `/api/{tabla}/{clave}`| Actualiza un registro               |
| `DELETE` | `/api/{tabla}/{clave}`| Elimina un registro                 |

Códigos: `201` creado, `204` eliminado, `404` no encontrado, `409` clave duplicada o relación en uso, `422` datos no válidos.

Ejemplo:
```bash
curl -X POST http://127.0.0.1:8000/api/lalaloopsy \
  -H "Content-Type: application/json" \
  -d '{"identificador":"LL-G-010","nombre":"Pix E. Flutterwings","precio_x_unidad":24900,"foto":"","tipo":"Grande"}'
```

## Funciones del frontend

- Pestañas para cada tabla, con contador de registros.
- Muñecas en tarjetas de colores por tipo, con filtro por tipo y buscador. Si no hay foto, la muñeca se dibuja con CSS.
- Crear, editar y eliminar registros con validación y mensajes claros.
- Listas desplegables para las relaciones (cliente y vendedor eligen una persona; la factura elige un vendedor).
- Diseño adaptable a celular.
- Las tipografías (Fredoka y Nunito) se cargan desde Google Fonts; sin internet se usan fuentes del sistema.

## Notas

- Los precios se muestran en colones (₡).
- El campo `vehiculo_atendido` de la factura se conserva tal como aparece en el diagrama.
