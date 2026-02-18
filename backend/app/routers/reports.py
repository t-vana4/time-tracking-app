from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WorkEntry
from app.schemas import SummaryItem, SummaryResponse

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("/summary", response_model=SummaryResponse)
async def get_summary(
    date_from: date = Query(..., alias="from"),
    date_to: date = Query(..., alias="to"),
    group_by: str = Query("project", regex="^(project|category)$"),
    projects: str | None = Query(None),
    categories: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    if group_by == "project":
        group_col = WorkEntry.project_name
    else:
        group_col = WorkEntry.category

    stmt = select(
        group_col.label("name"),
        func.sum(WorkEntry.duration_seconds).label("seconds"),
    ).where(
        WorkEntry.work_date >= date_from,
        WorkEntry.work_date <= date_to,
    )

    if projects:
        project_list = [p.strip() for p in projects.split(",") if p.strip()]
        if project_list:
            stmt = stmt.where(WorkEntry.project_name.in_(project_list))

    if categories:
        category_list = [c.strip() for c in categories.split(",") if c.strip()]
        if category_list:
            stmt = stmt.where(WorkEntry.category.in_(category_list))

    stmt = stmt.group_by(group_col).order_by(func.sum(WorkEntry.duration_seconds).desc())

    result = await db.execute(stmt)
    rows = result.all()

    total_seconds = sum(row.seconds for row in rows)
    items = []
    for row in rows:
        pct = round((row.seconds / total_seconds) * 100, 1) if total_seconds > 0 else 0.0
        items.append(SummaryItem(name=row.name, seconds=row.seconds, percentage=pct))

    return SummaryResponse(total_seconds=total_seconds, items=items)
