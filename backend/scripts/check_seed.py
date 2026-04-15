import asyncio, os, asyncpg

async def go():
    dsn = os.environ["DATABASE_URL"]
    if "asyncpg" in dsn:
        dsn = dsn.replace("postgresql+asyncpg://", "postgresql://", 1)
    print("host:", dsn.split("@")[1].split("/")[0])
    c = await asyncpg.connect(dsn, statement_cache_size=0)
    rows = await c.fetch("SELECT slug, id::text as id FROM organizations ORDER BY slug")
    for r in rows:
        print("org", r["slug"], r["id"])
    for oid in [
        "34791eb6-e33e-4c75-bd4f-65b1fcc8f5cb",
        "162e58e2-2530-4627-a0fa-9a5b5f824f14",
    ]:
        p = await c.fetchval("SELECT count(*) FROM projects WHERE org_id=$1", oid)
        w = await c.fetchval("SELECT count(*) FROM workers WHERE org_id=$1", oid)
        e = await c.fetchval("SELECT count(*) FROM evaluations WHERE org_id=$1", oid)
        print(oid, "p=", p, "w=", w, "e=", e)
    await c.close()

asyncio.run(go())
