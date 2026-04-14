import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select

from app.database import async_session, engine
from app.models.organization import Organization


async def main():
    async with async_session() as s:
        rows = (await s.execute(
            select(Organization.id, Organization.slug, Organization.name)
        )).all()
    for r in rows:
        print(f"{r.slug}\t{r.name}\t{r.id}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
