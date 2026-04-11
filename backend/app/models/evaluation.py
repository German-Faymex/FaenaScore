import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, SmallInteger, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class Evaluation(Base):
    __tablename__ = "evaluations"
    __table_args__ = (
        UniqueConstraint("project_id", "worker_id", name="uq_evaluation_project_worker"),
        Index("ix_evaluations_worker_id", "worker_id"),
        Index("ix_evaluations_org_id", "org_id"),
        Index("ix_evaluations_project_id", "project_id"),
        Index("ix_evaluations_score_avg", "score_average"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    evaluator_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    score_quality: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_safety: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_punctuality: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_teamwork: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_technical: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    score_average: Mapped[float] = mapped_column(Float, nullable=False)

    would_rehire: Mapped[str] = mapped_column(String(20), nullable=False)
    rehire_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="evaluations")
    worker: Mapped["Worker"] = relationship("Worker", back_populates="evaluations")
    evaluator: Mapped["User | None"] = relationship("User")
