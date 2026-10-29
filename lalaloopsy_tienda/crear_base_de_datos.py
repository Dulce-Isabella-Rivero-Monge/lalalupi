"""Crea (o reinicia) la base de datos lalaloopsy.db.

Uso:
    python crear_base_de_datos.py              # crea las tablas si no existen
    python crear_base_de_datos.py --ejemplo    # además carga datos de ejemplo
    python crear_base_de_datos.py --reiniciar --ejemplo   # borra todo y empieza de cero
"""
import argparse

from database import DB_PATH, initialize_database


def main() -> None:
    parser = argparse.ArgumentParser(description="Crea la base de datos de la tienda Lalaloopsy.")
    parser.add_argument("--reiniciar", action="store_true", help="borra la base de datos actual")
    parser.add_argument("--ejemplo", action="store_true", help="carga datos de ejemplo")
    args = parser.parse_args()

    if args.reiniciar and DB_PATH.exists():
        DB_PATH.unlink()
        print(f"Base de datos anterior eliminada: {DB_PATH.name}")

    initialize_database(with_sample_data=args.ejemplo)
    print(f"Listo: {DB_PATH.name} {'con datos de ejemplo' if args.ejemplo else 'con tablas vacías'}.")


if __name__ == "__main__":
    main()
