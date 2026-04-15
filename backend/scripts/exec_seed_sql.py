"""Execute a SQL file via asyncpg with statement_timeout=0. Bypasses pgbouncer per-statement parse overhead by sending the whole file as one query."""

import asyncio
import os
import sys
import asyncpg


async def main(sql_path: str):
    dsn = os.environ["DATABASE_URL"]
    # asyncpg uses postgresql:// not postgresql+asyncpg://
    if dsn.startswith("postgresql+asyncpg://"):
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()
    conn = await asyncpg.connect(
        dsn,
        statement_cache_size=0,
        server_settings={"statement_timeout": "0"},
    )
    try:
        print(f"Executing {sql_path} ({len(sql)} bytes)...", flush=True)
        await conn.execute(sql)
        print("OK", flush=True)
        # Quick count
        org_id = sys.argv[2] if len(sys.argv) > 2 else None
        if org_id:
            p = await conn.fetchval("SELECT count(*) FROM projects WHERE org_id=$1", org_id)
            w = await conn.fetchval("SELECT count(*) FROM workers WHERE org_id=$1", org_id)
            e = await conn.fetchval("SELECT count(*) FROM evaluations WHERE org_id=$1", org_id)
            print(f"org={org_id} projects={p} workers={w} evaluations={e}", flush=True)
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1]))
