import csv
import io
from datetime import date

from dateutil.relativedelta import relativedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WorkEntry

router = APIRouter(prefix="/api/export", tags=["export"])


def format_duration(seconds: int) -> str:
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


@router.get("/csv")
async def export_csv(
    date_from: date = Query(..., alias="from"),
    date_to: date = Query(..., alias="to"),
    db: AsyncSession = Depends(get_db),
):
    # 12-month limit check
    limit_date = date_from + relativedelta(months=12)
    if date_to > limit_date:
        raise HTTPException(
            status_code=400,
            detail="期間は12ヶ月以内で指定してください。",
        )

    stmt = (
        select(WorkEntry)
        .where(WorkEntry.work_date >= date_from, WorkEntry.work_date <= date_to)
        .order_by(WorkEntry.work_date, WorkEntry.start_time)
    )
    result = await db.execute(stmt)
    rows = result.scalars().all()

    output = io.StringIO()
    # BOM for Excel
    output.write("\ufeff")

    writer = csv.writer(output)
    writer.writerow(
        ["タスク名", "プロジェクト名", "カテゴリ", "作業日", "開始時刻", "終了時刻", "作業時間"]
    )

    for row in rows:
        writer.writerow([
            row.task_name,
            row.project_name,
            row.category,
            row.work_date.isoformat(),
            row.start_time.strftime("%H:%M"),
            row.end_time.strftime("%H:%M"),
            format_duration(row.duration_seconds),
        ])

    output.seek(0)
    filename = f"time_tracking_{date_from.strftime('%Y%m%d')}_{date_to.strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
