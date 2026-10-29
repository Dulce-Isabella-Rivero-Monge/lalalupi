"""Conexión y creación de la base de datos SQLite de la tienda Lalaloopsy."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "lalaloopsy.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"
SEED_PATH = BASE_DIR / "datos_ejemplo.sql"


@contextmanager
def get_connection():
    """Abre una conexión con claves foráneas activadas.

    Confirma los cambios al salir sin errores, los revierte si algo falla
    y siempre cierra la conexión.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def initialize_database(with_sample_data: bool = False) -> None:
    """Crea las tablas (si no existen) y, opcionalmente, carga datos de ejemplo."""
    with get_connection() as conn:
        conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
        if with_sample_data:
            conn.executescript(SEED_PATH.read_text(encoding="utf-8"))
