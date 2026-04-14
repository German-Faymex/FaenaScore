"""Kill idle-in-transaction backends that may be holding locks on our tables."""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text

from app.database import async_session, engine


async def main():
    async with async_session() as s:
        # Inspect
        rows = (await s.execute(text(
            "SELECT pid, state, wait_event_type, wait_event, "
            "left(query, 80) as q "
            "FROM pg_stat_activity "
            "WHERE datname = current_database() AND pid <> pg_backend_pid()"
        ))).all()
        for r in rows:
            print("BACKEND", r.pid, r.state, r.wait_event_type, r.wait_event, "|", r.q)

        # Kill idle-in-tx and stuck backends
        killed = (await s.execute(text(
            "SELECT pg_terminate_backend(pid), pid FROM pg_stat_activity "
            "WHERE datname = current_database() "
            "AND pid <> pg_backend_pid() "
            "AND (state IN ('idle in transaction', 'idle in transaction (aborted)') "
            "     OR (state = 'active' AND now() - query_start > interval '30 seconds'))"
        ))).all()
        for r in killed:
            print("KILLED", r.pid)

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
