import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    client_name: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: Literal["planning", "active", "completed", "cancelled"] = "active"
    notes: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    client_name: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    status: Literal["planning", "active", "completed", "cancelled"] | None = None
    notes: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    client_name: str | None
    location: str | None
    start_date: date | None
    end_date: date | None
    status: str
    worker_count: int = 0
    evaluation_count: int = 0
    created_at: datetime
    model_config = {"from_attributes": True}


class AssignWorkersRequest(BaseModel):
    worker_ids: list[uuid.UUID]
    role_in_project: str | None = None
