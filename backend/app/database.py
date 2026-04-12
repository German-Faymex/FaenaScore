from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

_is_pgbouncer = "pooler.supabase" in settings.async_database_url or "pgbouncer" in settings.async_database_url

engine = create_async_engine(
    settings.async_database_url,
    echo=settings.DEBUG,
    pool_size=5,
    max_overflow=10,
    connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0} if _is_pgbouncer else {},
)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session() as session:
        yield session
