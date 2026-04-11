import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class EvaluationCreate(BaseModel):
    project_id: uuid.UUID
    worker_id: uuid.UUID
    score_quality: int = Field(..., ge=1, le=5)
    score_safety: int = Field(..., ge=1, le=5)
    score_punctuality: int = Field(..., ge=1, le=5)
    score_teamwork: int = Field(..., ge=1, le=5)
    score_technical: int = Field(..., ge=1, le=5)
    would_rehire: Literal["yes", "reservations", "no"]
    rehire_reason: str | None = None
    comment: str | None = None


class EvaluationUpdate(BaseModel):
    score_quality: int | None = Field(None, ge=1, le=5)
    score_safety: int | None = Field(None, ge=1, le=5)
    score_punctuality: int | None = Field(None, ge=1, le=5)
    score_teamwork: int | None = Field(None, ge=1, le=5)
    score_technical: int | None = Field(None, ge=1, le=5)
    would_rehire: Literal["yes", "reservations", "no"] | None = None
    rehire_reason: str | None = None
    comment: str | None = None


class EvaluationBatchCreate(BaseModel):
    evaluations: list[EvaluationCreate]


class EvaluationResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    project_name: str = ""
    worker_id: uuid.UUID
    worker_name: str = ""
    evaluator_name: str | None = None
    score_quality: int
    score_safety: int
    score_punctuality: int
    score_teamwork: int
    score_technical: int
    score_average: float
    would_rehire: str
    rehire_reason: str | None
    comment: str | None
    created_at: datetime
    model_config = {"from_attributes": True}
