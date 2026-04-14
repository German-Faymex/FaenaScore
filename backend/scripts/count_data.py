import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import func, select

from app.database import async_session, engine
from app.models.evaluation import Evaluation
from app.models.organization import Organization
from app.models.project import Project
from app.models.worker import Worker


async def main():
    async with async_session() as s:
        orgs = (await s.execute(select(Organization.id, Organization.slug))).all()
        for o in orgs:
            pc = (await s.execute(select(func.count(Project.id)).where(Project.org_id == o.id))).scalar()
            wc = (await s.execute(select(func.count(Worker.id)).where(Worker.org_id == o.id))).scalar()
            ec = (await s.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == o.id))).scalar()
            print(f"{o.slug}\tprojects={pc}\tworkers={wc}\tevals={ec}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
