"""Generate plain SQL to seed demo data. Usage: python -m scripts.gen_seed_sql <org_id>"""

import random
import sys
import uuid
from datetime import date, timedelta

FIRST_NAMES = ["Jose", "Juan", "Luis", "Carlos", "Pedro", "Miguel", "Jorge", "Manuel", "Francisco", "Ricardo", "Hector", "Raul", "Sergio", "Diego", "Rodrigo", "Cristian", "Felipe", "Matias", "Sebastian", "Claudio"]
LAST_NAMES = ["Gonzalez", "Munoz", "Rojas", "Diaz", "Perez", "Silva", "Soto", "Contreras", "Lopez", "Morales", "Araya", "Fuentes", "Valenzuela", "Reyes", "Vargas", "Castillo", "Espinoza", "Sepulveda", "Torres", "Aguilar"]
SPECIALTIES = ["Soldador", "Mecanico", "Electrico", "Instrumentista", "Canierista", "Calderero", "Operador Grua", "Rigger", "Pintor Industrial", "Andamiero", "Supervisor", "Prevencionista"]
CLIENTS = ["Codelco Andina", "Anglo American Los Bronces", "Minera Escondida"]
LOCATIONS = ["Los Andes, Region de Valparaiso", "Calama, Region de Antofagasta", "Copiapo, Region de Atacama"]
PROJECT_NAMES = ["Mantencion Mayor Concentradora", "Ampliacion Planta SX-EW", "Shutdown Molino SAG Q1"]
REHIRE_COMMENTS = {
    "yes": ["Excelente desempeno.", "Buen trabajo, cumple plazos.", "Recomendado 100%."],
    "reservations": ["Cumple pero necesita mas supervision.", "Llega atrasado a veces."],
    "no": ["No cumplio estandares de seguridad.", "Mala actitud."],
}


def compute_dv(body: int) -> str:
    total, mult = 0, 2
    for d in reversed(str(body)):
        total += int(d) * mult
        mult = mult + 1 if mult < 7 else 2
    r = 11 - (total % 11)
    return "0" if r == 11 else ("K" if r == 10 else str(r))


def fmt_rut(body: int) -> str:
    dv = compute_dv(body)
    s = str(body)
    parts = []
    while s:
        parts.insert(0, s[-3:])
        s = s[:-3]
    return ".".join(parts) + "-" + dv


def q(v):
    if v is None:
        return "NULL"
    if isinstance(v, bool):
        return "TRUE" if v else "FALSE"
    if isinstance(v, (int, float)):
        return str(v)
    return "'" + str(v).replace("'", "''") + "'"


def main(org_id: str):
    rng = random.Random(42)
    print("BEGIN;")
    print(f"DELETE FROM evaluations WHERE org_id = '{org_id}';")
    print(f"DELETE FROM project_workers WHERE project_id IN (SELECT id FROM projects WHERE org_id = '{org_id}');")
    print(f"DELETE FROM projects WHERE org_id = '{org_id}';")
    print(f"DELETE FROM workers WHERE org_id = '{org_id}';")

    project_ids = [str(uuid.uuid4()) for _ in range(3)]
    statuses_dates = [
        ("active", date.today() - timedelta(days=30), date.today() + timedelta(days=60)),
        ("active", date.today() - timedelta(days=60), date.today() + timedelta(days=30)),
        ("completed", date.today() - timedelta(days=180), date.today() - timedelta(days=30)),
    ]
    for pid, name, client, loc, (status, start, end) in zip(project_ids, PROJECT_NAMES, CLIENTS, LOCATIONS, statuses_dates):
        print(f"INSERT INTO projects (id, org_id, name, client_name, location, start_date, end_date, status) VALUES "
              f"('{pid}', '{org_id}', {q(name)}, {q(client)}, {q(loc)}, {q(start.isoformat())}, {q(end.isoformat())}, {q(status)});")

    worker_ids = [str(uuid.uuid4()) for _ in range(20)]
    for i, wid in enumerate(worker_ids):
        rut = fmt_rut(10_000_000 + ((i + 1) * 7919) % 15_000_000)
        fn = rng.choice(FIRST_NAMES); ln = rng.choice(LAST_NAMES); sp = rng.choice(SPECIALTIES)
        phone = f"+569{rng.randint(10000000, 99999999)}"
        print(f"INSERT INTO workers (id, org_id, rut, first_name, last_name, specialty, phone, is_active) VALUES "
              f"('{wid}', '{org_id}', {q(rut)}, {q(fn)}, {q(ln)}, {q(sp)}, {q(phone)}, TRUE);")

    assignments: dict[str, list[str]] = {}
    for pid in project_ids:
        team = rng.sample(worker_ids, rng.randint(10, 14))
        assignments[pid] = team
        for wid in team:
            print(f"INSERT INTO project_workers (project_id, worker_id) VALUES ('{pid}', '{wid}');")

    seen, count, target = set(), 0, 40
    while count < target:
        pid = rng.choice(project_ids)
        wid = rng.choice(assignments[pid])
        if (pid, wid) in seen:
            continue
        seen.add((pid, wid))
        scores = [rng.choices([1, 2, 3, 4, 5], weights=[2, 5, 20, 40, 33])[0] for _ in range(5)]
        avg = round(sum(scores) / 5.0, 2)
        if avg >= 4.0:
            rehire = rng.choices(["yes", "reservations"], weights=[85, 15])[0]
        elif avg >= 3.0:
            rehire = rng.choices(["yes", "reservations", "no"], weights=[40, 45, 15])[0]
        else:
            rehire = rng.choices(["reservations", "no"], weights=[30, 70])[0]
        comment = rng.choice(REHIRE_COMMENTS[rehire]) if rng.random() < 0.6 else None
        reason = comment if rehire != "yes" and comment else None
        print(f"INSERT INTO evaluations (org_id, project_id, worker_id, score_quality, score_safety, "
              f"score_punctuality, score_teamwork, score_technical, score_average, would_rehire, "
              f"rehire_reason, comment) VALUES "
              f"('{org_id}', '{pid}', '{wid}', {scores[0]}, {scores[1]}, {scores[2]}, {scores[3]}, "
              f"{scores[4]}, {avg}, {q(rehire)}, {q(reason)}, {q(comment)});")
        count += 1

    print("COMMIT;")


if __name__ == "__main__":
    main(sys.argv[1])
