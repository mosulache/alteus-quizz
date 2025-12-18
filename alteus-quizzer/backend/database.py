from sqlmodel import SQLModel, create_engine
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://alteus:password@localhost:5432/alteus_quizzer")

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)

        # --- Lightweight migrations (no Alembic) ---
        # Ensure `quiz.goal` exists for older databases created before the column was added.
        try:
            res = await conn.exec_driver_sql(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_name = 'quiz' AND column_name = 'goal'
                LIMIT 1
                """
            )
            has_goal = res.first() is not None
            if not has_goal:
                await conn.exec_driver_sql("ALTER TABLE quiz ADD COLUMN goal TEXT")
        except Exception:
            # Best-effort: don't block startup if the DB doesn't support information_schema or
            # the column already exists under different casing/schema settings.
            pass

        # Ensure Alteus override columns exist on `appsettings` for older databases.
        try:
            cols_res = await conn.exec_driver_sql(
                """
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'appsettings'
                """
            )
            existing_cols = {row[0] for row in (cols_res.all() or [])}
            if "alteus_api_url" not in existing_cols:
                await conn.exec_driver_sql("ALTER TABLE appsettings ADD COLUMN alteus_api_url TEXT")
            if "alteus_api_key" not in existing_cols:
                await conn.exec_driver_sql("ALTER TABLE appsettings ADD COLUMN alteus_api_key TEXT")
            if "alteus_endpoint_id" not in existing_cols:
                await conn.exec_driver_sql("ALTER TABLE appsettings ADD COLUMN alteus_endpoint_id TEXT")
        except Exception:
            # Best-effort; don't block startup if schema inspection isn't available.
            pass

async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

