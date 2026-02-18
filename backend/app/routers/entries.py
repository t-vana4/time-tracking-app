import uuid
from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import WorkEntry
from app.schemas import DeleteResult, EntryCreate, EntryResponse, EntryUpdate

router = APIRouter(prefix="/api/entries", tags=["entries"])


def calc_duration(start_time, end_time) -> int:
    today = date.today()
    dt_start = datetime.combine(today, start_time)
    dt_end = datetime.combine(today, end_time)
    diff = (dt_end - dt_start).total_seconds()
    if diff < 0:
        diff += 86400
    return int(diff)


@router.get("", response_model=list[EntryResponse])
async def list_entries(
    db: AsyncSession = Depends(get_db),
    week_of: date | None = Query(None, alias="week_of"),
    date_from: date | None = Query(None, alias="from"),
    date_to: date | None = Query(None, alias="to"),
):
    stmt = select(WorkEntry)

    if week_of is not None:
        # Monday of the week containing week_of
        monday = week_of - timedelta(days=week_of.weekday())
        friday = monday + timedelta(days=4)
        stmt = stmt.where(
            WorkEntry.work_date >= monday,
            WorkEntry.work_date <= friday,
        )
    else:
        if date_from is not None:
            stmt = stmt.where(WorkEntry.work_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(WorkEntry.work_date <= date_to)

    stmt = stmt.order_by(WorkEntry.work_date, WorkEntry.start_time)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=EntryResponse, status_code=201)
async def create_entry(
    entry: EntryCreate,
    db: AsyncSession = Depends(get_db),
):
    duration = calc_duration(entry.start_time, entry.end_time)
    row = WorkEntry(
        task_name=entry.task_name,
        project_name=entry.project_name,
        category=entry.category,
        work_date=entry.work_date,
        start_time=entry.start_time,
        end_time=entry.end_time,
        duration_seconds=duration,
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


@router.get("/{entry_id}", response_model=EntryResponse)
async def get_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(WorkEntry, entry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return row


@router.put("/{entry_id}", response_model=EntryResponse)
async def update_entry(
    entry_id: uuid.UUID,
    entry: EntryUpdate,
    db: AsyncSession = Depends(get_db),
):
    row = await db.get(WorkEntry, entry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Entry not found")

    data = entry.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(row, key, value)

    # Recalculate duration
    row.duration_seconds = calc_duration(row.start_time, row.end_time)

    await db.commit()
    await db.refresh(row)
    return row


@router.delete("/{entry_id}", status_code=204)
async def delete_entry(entry_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    row = await db.get(WorkEntry, entry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    await db.delete(row)
    await db.commit()


@router.delete("", response_model=DeleteResult)
async def bulk_delete_entries(
    date_from: date = Query(..., alias="from"),
    date_to: date = Query(..., alias="to"),
    db: AsyncSession = Depends(get_db),
):
    stmt = delete(WorkEntry).where(
        WorkEntry.work_date >= date_from,
        WorkEntry.work_date <= date_to,
    )
    result = await db.execute(stmt)
    await db.commit()
    return DeleteResult(deleted_count=result.rowcount)
