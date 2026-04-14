import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_org_member
from app.models.evaluation import Evaluation
from app.models.organization import OrgMember
from app.models.project import Project
from app.models.project_worker import ProjectWorker
from app.models.worker import Worker
from app.schemas.dashboard import DashboardStats, RecentEvaluationItem, SpecialtyCount, TopWorkerItem


class NextEvaluationResponse(BaseModel):
    project_id: uuid.UUID | None = None
    project_name: str | None = None
    worker_id: uuid.UUID | None = None
    worker_name: str | None = None
    pending_count: int = 0

router = APIRouter(prefix="/organizations/{org_id}/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    project_count = (await db.execute(select(func.count(Project.id)).where(Project.org_id == org_id))).scalar() or 0
    active_count = (await db.execute(select(func.count(Project.id)).where(Project.org_id == org_id, Project.status == "active"))).scalar() or 0
    worker_count = (await db.execute(select(func.count(Worker.id)).where(Worker.org_id == org_id, Worker.is_active == True))).scalar() or 0  # noqa: E712
    eval_count = (await db.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == org_id))).scalar() or 0

    avg_score = (await db.execute(select(func.avg(Evaluation.score_average)).where(Evaluation.org_id == org_id))).scalar()
    avg_score = round(avg_score, 2) if avg_score else None

    rehire_yes = (await db.execute(select(func.count(Evaluation.id)).where(Evaluation.org_id == org_id, Evaluation.would_rehire == "yes"))).scalar() or 0
    rehire_rate = round(rehire_yes / eval_count, 2) if eval_count > 0 else None

    # Specialty distribution
    spec_result = await db.execute(
        select(Worker.specialty, func.count(Worker.id))
        .where(Worker.org_id == org_id, Worker.is_active == True)  # noqa: E712
        .group_by(Worker.specialty)
        .order_by(func.count(Worker.id).desc())
    )
    specialty_distribution = [SpecialtyCount(specialty=s, count=c) for s, c in spec_result.all()]

    return DashboardStats(
        project_count=project_count, active_project_count=active_count,
        worker_count=worker_count, evaluation_count=eval_count,
        avg_score_overall=avg_score, rehire_rate=rehire_rate,
        specialty_distribution=specialty_distribution,
    )


@router.get("/top-workers", response_model=list[TopWorkerItem])
async def get_top_workers(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    result = await db.execute(
        select(
            Worker.id, Worker.first_name, Worker.last_name, Worker.specialty,
            func.avg(Evaluation.score_average).label("avg_score"),
            func.count(Evaluation.id).label("eval_count"),
        )
        .join(Evaluation, Evaluation.worker_id == Worker.id)
        .where(Worker.org_id == org_id, Worker.is_active == True)  # noqa: E712
        .group_by(Worker.id, Worker.first_name, Worker.last_name, Worker.specialty)
        .having(func.count(Evaluation.id) >= 1)
        .order_by(func.avg(Evaluation.score_average).desc())
        .limit(10)
    )
    rows = result.all()

    items = []
    for wid, fname, lname, spec, avg_s, ec in rows:
        rehire_yes = (await db.execute(
            select(func.count(Evaluation.id)).where(Evaluation.worker_id == wid, Evaluation.would_rehire == "yes")
        )).scalar() or 0
        pct = round(rehire_yes / ec * 100, 0) if ec > 0 else 0

        items.append(TopWorkerItem(
            id=wid, full_name=f"{fname} {lname}", specialty=spec,
            avg_score=round(avg_s, 2), evaluation_count=ec, would_rehire_pct=pct,
        ))
    return items


@router.get("/next-evaluation", response_model=NextEvaluationResponse)
async def get_next_pending_evaluation(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    """Returns the next pending evaluation: the project with most unevaluated
    assigned workers, and the first worker in that project without an evaluation."""

    evaluated_subq = (
        select(Evaluation.project_id, Evaluation.worker_id)
        .where(Evaluation.org_id == org_id)
        .subquery()
    )

    # Count unevaluated workers per active project
    pending_per_project = await db.execute(
        select(
            Project.id, Project.name, func.count(ProjectWorker.worker_id).label("pending"),
        )
        .join(ProjectWorker, ProjectWorker.project_id == Project.id)
        .outerjoin(
            evaluated_subq,
            (evaluated_subq.c.project_id == ProjectWorker.project_id)
            & (evaluated_subq.c.worker_id == ProjectWorker.worker_id),
        )
        .where(
            Project.org_id == org_id,
            Project.status == "active",
            evaluated_subq.c.worker_id.is_(None),
        )
        .group_by(Project.id, Project.name)
        .order_by(func.count(ProjectWorker.worker_id).desc())
        .limit(1)
    )
    top = pending_per_project.first()
    if not top:
        return NextEvaluationResponse()

    project_id, project_name, pending = top

    worker_row = (await db.execute(
        select(Worker.id, Worker.first_name, Worker.last_name)
        .join(ProjectWorker, ProjectWorker.worker_id == Worker.id)
        .outerjoin(
            evaluated_subq,
            (evaluated_subq.c.project_id == ProjectWorker.project_id)
            & (evaluated_subq.c.worker_id == ProjectWorker.worker_id),
        )
        .where(
            ProjectWorker.project_id == project_id,
            evaluated_subq.c.worker_id.is_(None),
        )
        .order_by(Worker.last_name.asc(), Worker.first_name.asc())
        .limit(1)
    )).first()

    if not worker_row:
        return NextEvaluationResponse()

    return NextEvaluationResponse(
        project_id=project_id,
        project_name=project_name,
        worker_id=worker_row.id,
        worker_name=f"{worker_row.first_name} {worker_row.last_name}",
        pending_count=pending,
    )


@router.get("/recent-evaluations", response_model=list[RecentEvaluationItem])
async def get_recent_evaluations(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    result = await db.execute(
        select(Evaluation, Worker.first_name, Worker.last_name, Project.name)
        .join(Worker, Evaluation.worker_id == Worker.id)
        .join(Project, Evaluation.project_id == Project.id)
        .where(Evaluation.org_id == org_id)
        .order_by(Evaluation.created_at.desc())
        .limit(10)
    )
    rows = result.all()

    return [
        RecentEvaluationItem(
            id=ev.id, worker_name=f"{fname} {lname}", project_name=pname,
            score_average=ev.score_average, would_rehire=ev.would_rehire, created_at=ev.created_at,
        )
        for ev, fname, lname, pname in rows
    ]
