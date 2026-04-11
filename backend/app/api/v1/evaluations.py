import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user, get_org_member
from app.errors import ErrorCode
from app.models.evaluation import Evaluation
from app.models.organization import OrgMember
from app.models.project import Project
from app.models.user import User
from app.models.worker import Worker
from app.schemas.evaluation import EvaluationBatchCreate, EvaluationCreate, EvaluationResponse, EvaluationUpdate
from app.schemas.pagination import PaginatedResponse
from app.services.score_calculator import compute_average

router = APIRouter(prefix="/organizations/{org_id}/evaluations", tags=["evaluations"])


async def _build_response(ev: Evaluation, db: AsyncSession) -> EvaluationResponse:
    proj = await db.execute(select(Project.name).where(Project.id == ev.project_id))
    project_name = proj.scalar_one_or_none() or ""

    w = await db.execute(select(Worker.first_name, Worker.last_name).where(Worker.id == ev.worker_id))
    row = w.one_or_none()
    worker_name = f"{row[0]} {row[1]}" if row else ""

    evaluator_name = None
    if ev.evaluator_id:
        u = await db.execute(select(User.full_name).where(User.id == ev.evaluator_id))
        evaluator_name = u.scalar_one_or_none()

    return EvaluationResponse(
        id=ev.id, project_id=ev.project_id, project_name=project_name,
        worker_id=ev.worker_id, worker_name=worker_name, evaluator_name=evaluator_name,
        score_quality=ev.score_quality, score_safety=ev.score_safety,
        score_punctuality=ev.score_punctuality, score_teamwork=ev.score_teamwork,
        score_technical=ev.score_technical, score_average=ev.score_average,
        would_rehire=ev.would_rehire, rehire_reason=ev.rehire_reason,
        comment=ev.comment, created_at=ev.created_at,
    )


async def _create_single(org_id: uuid.UUID, body: EvaluationCreate, evaluator_id: uuid.UUID, db: AsyncSession) -> Evaluation:
    # Check duplicate
    existing = await db.execute(
        select(Evaluation).where(Evaluation.project_id == body.project_id, Evaluation.worker_id == body.worker_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail={"detail": "Ya existe una evaluacion para este trabajador en este proyecto", "code": ErrorCode.EVALUATION_DUPLICATE})

    avg = compute_average(body.score_quality, body.score_safety, body.score_punctuality, body.score_teamwork, body.score_technical)

    ev = Evaluation(
        org_id=org_id,
        project_id=body.project_id,
        worker_id=body.worker_id,
        evaluator_id=evaluator_id,
        score_quality=body.score_quality,
        score_safety=body.score_safety,
        score_punctuality=body.score_punctuality,
        score_teamwork=body.score_teamwork,
        score_technical=body.score_technical,
        score_average=avg,
        would_rehire=body.would_rehire,
        rehire_reason=body.rehire_reason,
        comment=body.comment,
    )
    db.add(ev)
    return ev


@router.post("", response_model=EvaluationResponse, status_code=201)
async def create_evaluation(
    org_id: uuid.UUID,
    body: EvaluationCreate,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
    user: User = Depends(get_current_user),
):
    ev = await _create_single(org_id, body, user.id, db)
    await db.commit()
    await db.refresh(ev)
    return await _build_response(ev, db)


@router.post("/batch", status_code=201)
async def create_evaluations_batch(
    org_id: uuid.UUID,
    body: EvaluationBatchCreate,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
    user: User = Depends(get_current_user),
):
    results = []
    errors = []
    for i, ev_data in enumerate(body.evaluations):
        try:
            ev = await _create_single(org_id, ev_data, user.id, db)
            await db.flush()
            results.append(str(ev.id))
        except HTTPException as e:
            errors.append({"index": i, "worker_id": str(ev_data.worker_id), "error": e.detail})

    await db.commit()
    return {"created": len(results), "errors": errors}


@router.get("", response_model=PaginatedResponse[EvaluationResponse])
async def list_evaluations(
    org_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    project_id: uuid.UUID | None = None,
    worker_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    from sqlalchemy import func

    query = select(Evaluation).where(Evaluation.org_id == org_id)
    count_query = select(func.count(Evaluation.id)).where(Evaluation.org_id == org_id)

    if project_id:
        query = query.where(Evaluation.project_id == project_id)
        count_query = count_query.where(Evaluation.project_id == project_id)
    if worker_id:
        query = query.where(Evaluation.worker_id == worker_id)
        count_query = count_query.where(Evaluation.worker_id == worker_id)

    total = (await db.execute(count_query)).scalar() or 0
    offset = (page - 1) * size
    result = await db.execute(query.order_by(Evaluation.created_at.desc()).offset(offset).limit(size))
    evals = result.scalars().all()

    items = [await _build_response(ev, db) for ev in evals]
    return PaginatedResponse(items=items, total=total, page=page, size=size, pages=(total + size - 1) // size if total else 0)


@router.patch("/{eval_id}", response_model=EvaluationResponse)
async def update_evaluation(
    org_id: uuid.UUID,
    eval_id: uuid.UUID,
    body: EvaluationUpdate,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    result = await db.execute(select(Evaluation).where(Evaluation.id == eval_id, Evaluation.org_id == org_id))
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail={"detail": "Evaluation not found", "code": ErrorCode.EVALUATION_NOT_FOUND})

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(ev, field, value)

    # Recompute average
    ev.score_average = compute_average(ev.score_quality, ev.score_safety, ev.score_punctuality, ev.score_teamwork, ev.score_technical)

    await db.commit()
    await db.refresh(ev)
    return await _build_response(ev, db)


@router.delete("/{eval_id}", status_code=204)
async def delete_evaluation(
    org_id: uuid.UUID,
    eval_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _member: OrgMember = Depends(get_org_member),
):
    result = await db.execute(select(Evaluation).where(Evaluation.id == eval_id, Evaluation.org_id == org_id))
    ev = result.scalar_one_or_none()
    if not ev:
        raise HTTPException(status_code=404, detail={"detail": "Evaluation not found", "code": ErrorCode.EVALUATION_NOT_FOUND})
    await db.delete(ev)
    await db.commit()
