from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WorkEntry

router = APIRouter(prefix="/api/suggestions", tags=["suggestions"])


@router.get("/tasks", response_model=list[str])
async def suggest_tasks(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkEntry.task_name).distinct().order_by(WorkEntry.task_name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/projects", response_model=list[str])
async def suggest_projects(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkEntry.project_name).distinct().order_by(WorkEntry.project_name)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/categories", response_model=list[str])
async def suggest_categories(db: AsyncSession = Depends(get_db)):
    stmt = select(WorkEntry.category).distinct().order_by(WorkEntry.category)
    result = await db.execute(stmt)
    return result.scalars().all()
