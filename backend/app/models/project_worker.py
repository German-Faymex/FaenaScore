import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models import Base


class ProjectWorker(Base):
    __tablename__ = "project_workers"
    __table_args__ = (
        UniqueConstraint("project_id", "worker_id", name="uq_project_worker"),
        Index("ix_project_workers_project_id", "project_id"),
        Index("ix_project_workers_worker_id", "worker_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    worker_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("workers.id", ondelete="CASCADE"), nullable=False)
    role_in_project: Mapped[str | None] = mapped_column(String(100), nullable=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    project: Mapped["Project"] = relationship("Project", back_populates="assignments")
    worker: Mapped["Worker"] = relationship("Worker", back_populates="assignments")
