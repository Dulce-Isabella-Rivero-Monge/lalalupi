"""API REST para administrar la tienda Lalaloopsy.

Ejecutar:  uvicorn main:app --reload
"""
from contextlib import asynccontextmanager
from datetime import date
from pathlib import Path
from typing import Literal
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, ValidationError

from database import get_connection, initialize_database

TIPOS_MUNECA = Literal["Grande", "Mini", "Little", "Silly Hair", "Loopy Hair"]


# --------------------------------------------------------------------------
# Modelos (uno por tabla del diagrama)
# --------------------------------------------------------------------------
class Persona(BaseModel):
    cedula: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=80)
    apellido: str = Field(min_length=1, max_length=100)
    correo: str = Field(min_length=3, max_length=120, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    telefono: str = Field(min_length=1, max_length=30)


class Cliente(BaseModel):
    cedula: str = Field(min_length=1, max_length=30)
    tipo: str = Field(min_length=1, max_length=40)


class Vendedor(BaseModel):
    cedula: str = Field(min_length=1, max_length=30)
    especialidad: str = Field(min_length=1, max_length=80)
    salario_x_hora: float = Field(ge=0)


class Lalaloopsy(BaseModel):
    identificador: str = Field(min_length=1, max_length=30)
    nombre: str = Field(min_length=1, max_length=100)
    precio_x_unidad: float = Field(ge=0)
    foto: str = ""
    tipo: TIPOS_MUNECA


class Factura(BaseModel):
    identificador: str = Field(min_length=1, max_length=30)
    fecha: date
    monto_total: float = Field(ge=0)
    cantidad_horas_trabajo: float = Field(ge=0)
    vehiculo_atendido: str = Field(min_length=1, max_length=100)
    atendido_por: str = Field(min_length=1, max_length=30)


MODELS = {
    "persona": Persona,
    "cliente": Cliente,
    "vendedor": Vendedor,
    "lalaloopsy": Lalaloopsy,
    "factura": Factura,
}
PRIMARY_KEYS = {
    "persona": "cedula",
    "cliente": "cedula",
    "vendedor": "cedula",
    "lalaloopsy": "identificador",
    "factura": "identificador",
}
TABLES = frozenset(MODELS)  # lista blanca: solo estos nombres llegan al SQL


# --------------------------------------------------------------------------
# Aplicación
# --------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title="Tienda Lalaloopsy", version="2.0.0", lifespan=lifespan)
STATIC_DIR = Path(__file__).resolve().parent / "static"
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def home():
    return FileResponse(STATIC_DIR / "index.html")


# --------------------------------------------------------------------------
# Utilidades
# --------------------------------------------------------------------------
MENSAJES = {
    "missing": "es obligatorio",
    "string_too_short": "es demasiado corto o está vacío",
    "string_too_long": "es demasiado largo",
    "string_pattern_mismatch": "no tiene un formato válido",
    "greater_than_equal": "no puede ser negativo",
    "literal_error": "tiene un valor no permitido",
    "date_from_datetime_parsing": "no es una fecha válida",
    "date_parsing": "no es una fecha válida",
    "date_type": "no es una fecha válida",
    "float_parsing": "debe ser un número",
    "float_type": "debe ser un número",
    "string_type": "debe ser texto",
}


def validar(table: str, payload: dict) -> dict:
    """Valida el cuerpo con el modelo de la tabla y devuelve un dict listo para SQL."""
    if table not in TABLES:
        raise HTTPException(status_code=404, detail="Entidad no encontrada")
    try:
        return MODELS[table].model_validate(payload).model_dump(mode="json")
    except ValidationError as exc:
        partes = [
            f"«{'.'.join(str(p) for p in err['loc'])}» {MENSAJES.get(err['type'], 'no es válido')}"
            for err in exc.errors()
        ]
        raise HTTPException(status_code=422, detail="; ".join(partes)) from exc


def comprobar_tabla(table: str) -> None:
    if table not in TABLES:
        raise HTTPException(status_code=404, detail="Entidad no encontrada")


def error_integridad(exc: sqlite3.IntegrityError):
    texto = str(exc).upper()
    if "UNIQUE" in texto or "PRIMARY KEY" in texto:
        detalle = "Ya existe un registro con esa clave."
    else:
        detalle = (
            "La relación no existe o el registro está en uso "
            "(por ejemplo, una persona que ya es cliente o vendedor, "
            "o un vendedor con facturas)."
        )
    raise HTTPException(status_code=409, detail=detalle) from exc


# --------------------------------------------------------------------------
# Endpoints
# --------------------------------------------------------------------------
@app.get("/api/resumen")
def resumen():
    """Cantidad de registros por tabla (se declara antes de /api/{table})."""
    with get_connection() as conn:
        return {t: conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0] for t in sorted(TABLES)}


@app.get("/api/{table}")
def list_rows(table: str):
    comprobar_tabla(table)
    with get_connection() as conn:
        rows = conn.execute(f"SELECT * FROM {table} ORDER BY {PRIMARY_KEYS[table]}").fetchall()
    return [dict(row) for row in rows]


@app.get("/api/{table}/{key}")
def get_row(table: str, key: str):
    comprobar_tabla(table)
    with get_connection() as conn:
        row = conn.execute(
            f"SELECT * FROM {table} WHERE {PRIMARY_KEYS[table]} = ?", (key,)
        ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return dict(row)


@app.post("/api/{table}", status_code=201)
def create_row(table: str, payload: dict):
    data = validar(table, payload)
    columns = list(data)
    placeholders = ", ".join("?" for _ in columns)
    try:
        with get_connection() as conn:
            conn.execute(
                f"INSERT INTO {table} ({', '.join(columns)}) VALUES ({placeholders})",
                list(data.values()),
            )
    except sqlite3.IntegrityError as exc:
        error_integridad(exc)
    return data


@app.put("/api/{table}/{key}")
def update_row(table: str, key: str, payload: dict):
    data = validar(table, payload)
    primary_key = PRIMARY_KEYS[table]
    if data[primary_key] != key:
        raise HTTPException(status_code=400, detail="La clave de la URL debe coincidir con la del cuerpo")
    fields = [column for column in data if column != primary_key]
    try:
        with get_connection() as conn:
            result = conn.execute(
                f"UPDATE {table} SET {', '.join(f'{c} = ?' for c in fields)} WHERE {primary_key} = ?",
                [data[c] for c in fields] + [key],
            )
    except sqlite3.IntegrityError as exc:
        error_integridad(exc)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    return data


@app.delete("/api/{table}/{key}", status_code=204)
def delete_row(table: str, key: str):
    comprobar_tabla(table)
    try:
        with get_connection() as conn:
            result = conn.execute(
                f"DELETE FROM {table} WHERE {PRIMARY_KEYS[table]} = ?", (key,)
            )
    except sqlite3.IntegrityError as exc:
        error_integridad(exc)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
