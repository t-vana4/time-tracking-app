import uuid
from datetime import date, datetime, time

from pydantic import BaseModel


class EntryCreate(BaseModel):
    task_name: str
    project_name: str
    category: str
    work_date: date
    start_time: time
    end_time: time


class EntryUpdate(BaseModel):
    task_name: str | None = None
    project_name: str | None = None
    category: str | None = None
    work_date: date | None = None
    start_time: time | None = None
    end_time: time | None = None


class EntryResponse(BaseModel):
    id: uuid.UUID
    task_name: str
    project_name: str
    category: str
    work_date: date
    start_time: time
    end_time: time
    duration_seconds: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DeleteResult(BaseModel):
    deleted_count: int


class SummaryItem(BaseModel):
    name: str
    seconds: int
    percentage: float


class SummaryResponse(BaseModel):
    total_seconds: int
    items: list[SummaryItem]
