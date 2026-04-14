"""Seed demo data for a given organization.

Usage:
    python -m scripts.seed_demo --org-id <UUID>
    python -m scripts.seed_demo --org-slug my-org
    python -m scripts.seed_demo --org-slug my-org --wipe

Creates 3 projects, 20 workers, ~40 evaluations with realistic Chilean data.
Skips duplicates based on RUT + project name.
"""

from __future__ import annotations

import argparse
import asyncio
import random
import sys
import uuid
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import delete, select

from app.database import async_session, engine
from app.models.evaluation import Evaluation
from app.models.organization import Organization
from app.models.project import Project
from app.models.project_worker import ProjectWorker
from app.models.worker import Worker
from app.services.rut_validator import format_rut
from app.services.score_calculator import compute_average

FIRST_NAMES = [
    "Jose", "Juan", "Luis", "Carlos", "Pedro", "Miguel", "Jorge", "Manuel",
    "Francisco", "Ricardo", "Hector", "Raul", "Sergio", "Diego", "Rodrigo",
    "Cristian", "Felipe", "Matias", "Sebastian", "Claudio",
]
LAST_NAMES = [
    "Gonzalez", "Munoz", "Rojas", "Diaz", "Perez", "Silva", "Soto", "Contreras",
    "Lopez", "Morales", "Araya", "Fuentes", "Valenzuela", "Reyes", "Vargas",
    "Castillo", "Espinoza", "Sepulveda", "Torres", "Aguilar", "Alarcon",
    "Herrera", "Pizarro", "Navarro", "Carrasco",
]
SPECIALTIES = [
    "Soldador", "Mecanico", "Electrico", "Instrumentista", "Canierista",
    "Calderero", "Operador Grua", "Rigger", "Pintor Industrial", "Andamiero",
    "Supervisor", "Prevencionista",
]
CLIENTS = [
    "Codelco Andina", "Anglo American Los Bronces", "Minera Escondida",
    "Colbun S.A.", "Enel Generacion", "Collahuasi",
]
LOCATIONS = [
    "Los Andes, Region de Valparaiso", "Calama, Region de Antofagasta",
    "Copiapo, Region de Atacama", "Rancagua, Region de O'Higgins",
    "Iquique, Region de Tarapaca", "Puchuncavi, Region de Valparaiso",
]
PROJECT_NAMES = [
    "Mantencion Mayor Concentradora", "Ampliacion Planta SX-EW",
    "Shutdown Molino SAG Q1", "Instalacion Nueva Correa Overland",
    "Detencion Programada Chancador Primario", "Overhaul Horno Flash",
]
REHIRE_COMMENTS = {
    "yes": [
        "Excelente desempeno, muy profesional.", "Buen trabajo, cumple plazos.",
        "Recomendado 100%, muy responsable.", "Trabajo impecable, sin observaciones.",
    ],
    "reservations": [
        "Cumple pero necesita mas supervision.", "Llega atrasado a veces.",
        "Buen tecnico pero problemas con el equipo.",
    ],
    "no": [
        "No cumplio estandares de seguridad.", "Mala actitud con el equipo.",
        "Calidad insuficiente para la faena.",
    ],
}


def compute_dv(body: int) -> str:
    total = 0
    multiplier = 2
    for digit in reversed(str(body)):
        total += int(digit) * multiplier
        multiplier = multiplier + 1 if multiplier < 7 else 2
    remainder = 11 - (total % 11)
    if remainder == 11:
        return "0"
    if remainder == 10:
        return "K"
    return str(remainder)


def generate_rut(seed: int) -> str:
    body = 10_000_000 + (seed * 7919) % 15_000_000
    return format_rut(f"{body}{compute_dv(body)}")


async def resolve_org(session, args) -> Organization:
    if args.org_id:
        org = await session.get(Organization, uuid.UUID(args.org_id))
    else:
        stmt = select(Organization).where(Organization.slug == args.org_slug)
        org = (await session.execute(stmt)).scalar_one_or_none()
    if not org:
        raise SystemExit(f"Organization not found: {args.org_id or args.org_slug}")
    return org


async def wipe_org_data(session, org_id: uuid.UUID) -> None:
    # FK cascade handles children; delete projects and workers directly.
    await session.execute(delete(Evaluation).where(Evaluation.org_id == org_id))
    await session.execute(delete(ProjectWorker).where(
        ProjectWorker.project_id.in_(select(Project.id).where(Project.org_id == org_id))
    ))
    await session.execute(delete(Project).where(Project.org_id == org_id))
    await session.execute(delete(Worker).where(Worker.org_id == org_id))
    await session.commit()


async def seed(org: Organization, wipe: bool) -> dict:
    rng = random.Random(42)
    async with async_session() as session:
        if wipe:
            await wipe_org_data(session, org.id)

        # Projects
        projects: list[Project] = []
        statuses_dates = [
            ("active", date.today() - timedelta(days=30), date.today() + timedelta(days=60)),
            ("active", date.today() - timedelta(days=60), date.today() + timedelta(days=30)),
            ("completed", date.today() - timedelta(days=180), date.today() - timedelta(days=30)),
        ]
        for i, (status, start, end) in enumerate(statuses_dates):
            p = Project(
                org_id=org.id,
                name=PROJECT_NAMES[i],
                client_name=CLIENTS[i % len(CLIENTS)],
                location=LOCATIONS[i % len(LOCATIONS)],
                start_date=start,
                end_date=end,
                status=status,
            )
            session.add(p)
            projects.append(p)
        await session.flush()

        # Workers
        workers: list[Worker] = []
        existing_ruts = set(
            r for (r,) in (await session.execute(
                select(Worker.rut).where(Worker.org_id == org.id)
            )).all()
        )
        for i in range(20):
            rut = generate_rut(i + 1)
            if rut in existing_ruts:
                continue
            w = Worker(
                org_id=org.id,
                rut=rut,
                first_name=rng.choice(FIRST_NAMES),
                last_name=rng.choice(LAST_NAMES),
                specialty=rng.choice(SPECIALTIES),
                phone=f"+569{rng.randint(10000000, 99999999)}",
                email=None,
                is_active=True,
            )
            session.add(w)
            workers.append(w)
        await session.flush()

        # Assignments: each project gets 10-14 workers (overlapping)
        assignments: dict[uuid.UUID, list[Worker]] = {}
        for p in projects:
            count = rng.randint(10, min(14, len(workers)))
            team = rng.sample(workers, count)
            assignments[p.id] = team
            for w in team:
                session.add(ProjectWorker(project_id=p.id, worker_id=w.id))
        await session.flush()

        # Evaluations: ~40 distributed across projects
        evals_created = 0
        target = 40
        seen: set[tuple[uuid.UUID, uuid.UUID]] = set()
        while evals_created < target:
            p = rng.choice(projects)
            team = assignments[p.id]
            w = rng.choice(team)
            key = (p.id, w.id)
            if key in seen:
                continue
            seen.add(key)

            # Realistic distribution: weighted toward 3-5
            scores = [rng.choices([1, 2, 3, 4, 5], weights=[2, 5, 20, 40, 33])[0] for _ in range(5)]
            avg = compute_average(*scores)
            if avg >= 4.0:
                rehire = rng.choices(["yes", "reservations"], weights=[85, 15])[0]
            elif avg >= 3.0:
                rehire = rng.choices(["yes", "reservations", "no"], weights=[40, 45, 15])[0]
            else:
                rehire = rng.choices(["reservations", "no"], weights=[30, 70])[0]

            comment = rng.choice(REHIRE_COMMENTS[rehire]) if rng.random() < 0.6 else None
            reason = comment if rehire != "yes" and comment else None

            session.add(Evaluation(
                org_id=org.id,
                project_id=p.id,
                worker_id=w.id,
                score_quality=scores[0],
                score_safety=scores[1],
                score_punctuality=scores[2],
                score_teamwork=scores[3],
                score_technical=scores[4],
                score_average=avg,
                would_rehire=rehire,
                rehire_reason=reason,
                comment=comment,
            ))
            evals_created += 1

        await session.commit()
        return {
            "projects": len(projects),
            "workers": len(workers),
            "evaluations": evals_created,
        }


async def main() -> None:
    parser = argparse.ArgumentParser()
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--org-id", help="Organization UUID")
    group.add_argument("--org-slug", help="Organization slug")
    parser.add_argument("--wipe", action="store_true", help="Delete existing projects/workers/evaluations first")
    args = parser.parse_args()

    async with async_session() as session:
        org = await resolve_org(session, args)

    result = await seed(org, args.wipe)
    print(f"Seeded org '{org.name}' ({org.slug}): {result}")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
