# FaenaScore — Progreso de Desarrollo

## Ultima actualizacion: 2026-04-13T17:45:00-04:00

## Estado actual
- Fase: MVP Semana 1 + polish + deploy + Clerk auth real COMPLETADOS
- Branch activo: master
- Ultimo commit: 86a6aa3 — fix: register Clerk token getter synchronously before OrgProvider mounts

## Sesion 13 abr 2026 — Clerk auth real en produccion
- Clerk Development instance creada (willing-monitor-52.clerk.accounts.dev)
- 4 env vars seteadas en Railway: CLERK_SECRET_KEY, CLERK_JWKS_URL, CLERK_ISSUER, VITE_CLERK_PUBLISHABLE_KEY
- AUTH_MOCK_ENABLED=False, ALLOW_MOCK_IN_PROD=False
- CORS_ORIGINS restringido al dominio prod
- DATABASE_URL rotado (password nuevo Supabase)
- Dockerfile: ARG/ENV para pasar VITE_CLERK_PUBLISHABLE_KEY al build stage
- alembic/env.py: connect_args statement_cache_size=0 para pgbouncer
- App.tsx: SignedIn/SignedOut gate + setAuthTokenGetter sincrono (bug: useEffect corre despues de OrgProvider)
- Verificado end-to-end: login con Clerk, dashboard carga con Bearer token
- Repo: https://github.com/German-Faymex/FaenaScore
- **Produccion**: https://faenascore-production.up.railway.app
- **Railway project**: https://railway.com/project/7ec526bb-74bc-4796-bac4-4c89bde2d6bd
- **Supabase project ref**: sudhcjpiixkkwywapvpe (region sa-east-1)

## Resumen sesion 12 de abril 2026

### Bloque 1: Formularios CRUD (commit 7259787)
- Modal reutilizable (ui/Modal.tsx, mobile sheet + desktop center)
- NewProjectForm + NewWorkerForm (RUT validacion mod-11 cliente)
- ImportWorkersForm (dropzone Excel/CSV usando endpoint existente)
- AssignWorkersForm (multi-select con buscador)
- Wired en Projects.tsx, Workers.tsx, ProjectDetail.tsx
- Verificado end-to-end con Playwright local

### Bloque 2: Polish UI (commit 3e82a73)
- index.html title -> FaenaScore + meta description
- Skeleton.tsx (Card + Row variants) reemplaza "Cargando..."
- Empty states con CTAs a crear/importar
- EvaluateWorker: rehire reason required (>=3 chars) cuando != yes
- EvaluateWorker mobile: label stack sobre stars (no overflow a 375px)
- Verificado screenshots mobile 375px: Dashboard, Workers, Evaluate, ProjectDetail

### Bloque 3: Deploy produccion (commits 53d8e9b, faf46cd)
- ALLOW_MOCK_IN_PROD flag para testing sin Clerk todavia
- SPA fallback en main.py (sirve index.html para rutas no-/api)
- Dockerfile CMD: alembic upgrade head && uvicorn
- .env.example documentado
- Fix asyncpg statement_cache_size=0 para Supabase transaction pooler
- Supabase PostgreSQL creada (region sa-east-1, IPv4 shared pooler)
- Railway project faenascore creado, env vars seteadas, deploy OK
- Dominio: faenascore-production.up.railway.app
- DATABASE_URL rotado post-deploy (el primero quedo en chat)
- Smoke test: /api/health 200 + database connected, SPA routes 200, /api/v1/me OK

## Archivos nuevos hoy

| Archivo | Descripcion |
|---------|-------------|
| `frontend/src/components/ui/Modal.tsx` | Modal reutilizable responsive |
| `frontend/src/components/ui/Skeleton.tsx` | Skeleton + CardSkeleton + RowSkeleton |
| `frontend/src/components/forms/NewProjectForm.tsx` | Form crear proyecto |
| `frontend/src/components/forms/NewWorkerForm.tsx` | Form crear trabajador con RUT validado |
| `frontend/src/components/forms/ImportWorkersForm.tsx` | Modal upload Excel/CSV |
| `frontend/src/components/forms/AssignWorkersForm.tsx` | Multi-select asignar workers |
| `frontend/src/lib/rut.ts` | Validador RUT cliente (mod 11) |
| `.env.example` | Doc env vars |

## Env vars produccion (Railway)

- DATABASE_URL: Supabase pooler IPv4 (rotado 12 abr)
- DEBUG: False
- AUTH_MOCK_ENABLED: True
- ALLOW_MOCK_IN_PROD: True **(inseguro, solo testing)**
- CORS_ORIGINS: ["*"]

## Proximos pasos (para la proxima sesion)

### Prioridad 1: Seguridad (URGENTE antes de compartir con alguien real)
1. **Crear app Clerk produccion** — 4 vars: CLERK_SECRET_KEY, CLERK_JWKS_URL, CLERK_ISSUER, CLERK_AUDIENCE + VITE_CLERK_PUBLISHABLE_KEY en build
2. **Desactivar ALLOW_MOCK_IN_PROD** una vez Clerk funcione
3. **Restringir CORS_ORIGINS** al dominio real (hoy esta en "*")

### Prioridad 2: Decisiones de negocio
4. **Comprar dominio** faenascore.cl en NIC Chile (~$10k CLP/ano) — opcional, hoy funciona el subdominio Railway
5. **Landing page** — la home actual va directo al dashboard. Para mostrar a prospectos necesitamos una landing publica con pitch.

### Prioridad 3: Features para demo
6. **Seed data realista** para mostrar a potenciales clientes (3 proyectos, 20 workers, 40 evaluaciones distribuidas)
7. **Edit project + edit worker** — hoy solo se pueden crear, no editar
8. **Evaluate flow desde Dashboard** — boton "Evaluar siguiente pendiente" que salta al primer worker sin evaluar del proyecto mas activo
9. **Export CSV de trabajadores con scores** — util para gerentes de contratistas

### Prioridad 4: Quality
10. **Tests backend** — pytest fixtures + tests de RUT validator, score_calculator, endpoints criticos
11. **Error handling** — el apiFetch cliente deja "[object Object]" cuando backend devuelve array de errores (FastAPI validation). Aplanar a string legible.
12. **Code splitting frontend** — bundle 708KB, Vite warning. Lazy load Recharts, router, formularios.

## Problemas conocidos
- `CORS_ORIGINS=["*"]` en prod (inseguro pero no critico con auth mock)
- `AUTH_MOCK_ENABLED=True` en prod: cualquiera es "Dev User" con acceso total
- Bundle frontend 708KB (Recharts + lucide + Clerk) — sin code splitting
- apiFetch no maneja bien detail=array de FastAPI (muestra "[object Object]")
- Backend sin tests (baseline sprint 1 era E2E manual)

## Comandos utiles

```bash
# Backend local
cd backend && python -m uvicorn app.main:app --port 8001 --reload

# Frontend local
cd frontend && npx vite --port 5180

# PostgreSQL local
docker compose up -d  # puerto 5433

# Deploy (auto al hacer push, pero tambien)
railway up --detach

# Logs prod
railway logs

# Ver env vars prod
railway variables

# Health check prod
curl -s https://faenascore-production.up.railway.app/api/health
```
