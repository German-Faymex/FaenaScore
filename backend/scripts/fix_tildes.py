"""One-shot migration: add Spanish accents to existing DB rows.

Idempotent: running again is a no-op (the replacements only match the old forms).
Usage: railway run python -u scripts/fix_tildes.py
"""

import asyncio
import os

import asyncpg

FIRST_NAME_FIXES = {
    "Hector": "Héctor",
    "Jose": "José",
    "Raul": "Raúl",
    "Matias": "Matías",
    "Sebastian": "Sebastián",
}
LAST_NAME_FIXES = {
    "Gonzalez": "González",
    "Munoz": "Muñoz",
    "Diaz": "Díaz",
    "Perez": "Pérez",
    "Lopez": "López",
    "Sepulveda": "Sepúlveda",
    "Alarcon": "Alarcón",
}
SPECIALTY_FIXES = {
    "Mecanico": "Mecánico",
    "Electrico": "Eléctrico",
    "Canierista": "Cañerista",
}
PROJECT_NAME_FIXES = {
    "Mantencion Mayor Concentradora": "Mantención Mayor Concentradora",
    "Ampliacion Planta SX-EW": "Ampliación Planta SX-EW",
    "Instalacion Nueva Correa Overland": "Instalación Nueva Correa Overland",
    "Detencion Programada Chancador Primario": "Detención Programada Chancador Primario",
}
# Applied via chained REPLACE() so partial matches inside a longer string still fix
LOCATION_TOKEN_FIXES = {
    "Region ": "Región ",
    "Valparaiso": "Valparaíso",
    "Copiapo": "Copiapó",
    "Tarapaca": "Tarapacá",
    "Puchuncavi": "Puchuncaví",
}
CLIENT_TOKEN_FIXES = {
    "Colbun": "Colbún",
    "Generacion": "Generación",
}


async def go() -> None:
    dsn = os.environ["DATABASE_URL"]
    if "asyncpg" in dsn:
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    print("host:", dsn.split("@")[1].split("/")[0])

    conn = await asyncpg.connect(dsn, statement_cache_size=0)
    try:
        async with conn.transaction():
            total = 0

            for old, new in FIRST_NAME_FIXES.items():
                n = await conn.execute("UPDATE workers SET first_name = $1 WHERE first_name = $2", new, old)
                rows = int(n.split()[-1])
                total += rows
                if rows:
                    print(f"first_name {old!r} -> {new!r}: {rows}")

            for old, new in LAST_NAME_FIXES.items():
                n = await conn.execute("UPDATE workers SET last_name = $1 WHERE last_name = $2", new, old)
                rows = int(n.split()[-1])
                total += rows
                if rows:
                    print(f"last_name  {old!r} -> {new!r}: {rows}")

            for old, new in SPECIALTY_FIXES.items():
                n = await conn.execute("UPDATE workers SET specialty = $1 WHERE specialty = $2", new, old)
                rows = int(n.split()[-1])
                total += rows
                if rows:
                    print(f"specialty  {old!r} -> {new!r}: {rows}")

            for old, new in PROJECT_NAME_FIXES.items():
                n = await conn.execute("UPDATE projects SET name = $1 WHERE name = $2", new, old)
                rows = int(n.split()[-1])
                total += rows
                if rows:
                    print(f"project    {old!r} -> {new!r}: {rows}")

            # Chained REPLACE for free-text columns (location, client_name)
            loc_expr = "location"
            for old, new in LOCATION_TOKEN_FIXES.items():
                loc_expr = f"REPLACE({loc_expr}, '{old}', '{new}')"
            cli_expr = "client_name"
            for old, new in CLIENT_TOKEN_FIXES.items():
                cli_expr = f"REPLACE({cli_expr}, '{old}', '{new}')"

            n = await conn.execute(f"UPDATE projects SET location = {loc_expr} WHERE location IS NOT NULL AND location <> {loc_expr}")
            rows = int(n.split()[-1])
            total += rows
            if rows:
                print(f"project.location tokens: {rows}")

            n = await conn.execute(f"UPDATE projects SET client_name = {cli_expr} WHERE client_name IS NOT NULL AND client_name <> {cli_expr}")
            rows = int(n.split()[-1])
            total += rows
            if rows:
                print(f"project.client_name tokens: {rows}")

            print(f"\ntotal rows updated: {total}")
    finally:
        await conn.close()


asyncio.run(go())
