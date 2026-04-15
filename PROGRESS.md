# FaenaScore — Progreso de Desarrollo

## Ultima actualizacion: 2026-04-15T17:30:00-04:00

## Estado actual
- Fase: **Sprint MVP cerrado.** Todas las prioridades 1-4 del plan original terminadas. Proxima fase: pulido UX + decisiones de producto (monetizacion, dominio, launch).
- Branch activo: master
- Ultimo commit: `08e34b6` — perf: reduce dashboard backend queries from 18+ to 4
- Deploy prod: OK. Landing + app funcionando con data real.

## Comandos utiles para retomar

```bash
cd "C:/Users/Usuario/Claude Code German/FaenaScore"
git log --oneline -10           # ver ultimos commits
git status                       # estado working tree
railway status                   # ver deploy
railway logs                     # logs runtime
curl -s https://faenascore-production.up.railway.app/api/health | python -m json.tool

# Re-seedear data demo si hace falta:
cd backend
python -u scripts/gen_seed_sql.py 34791eb6-e33e-4c75-bd4f-65b1fcc8f5cb > /tmp/seed1.sql
python -u scripts/gen_seed_sql.py 162e58e2-2530-4627-a0fa-9a5b5f824f14 > /tmp/seed2.sql
railway run python -u scripts/exec_seed_sql.py /tmp/seed1.sql 34791eb6-e33e-4c75-bd4f-65b1fcc8f5cb
railway run python -u scripts/exec_seed_sql.py /tmp/seed2.sql 162e58e2-2530-4627-a0fa-9a5b5f824f14
railway run python -u scripts/check_seed.py   # verificar counts con conexion fresca
```

## Sesion 15 abr 2026 — Seed, perf, UX audit

### Bloque 1: Seed demo data resuelto (commits 07ffb29, a13d683)
**Problema pendiente de ayer**: seed no funcionaba via Supabase transaction pooler (timeouts).

**Solucion**: `backend/scripts/exec_seed_sql.py` (nuevo) — asyncpg connect con `statement_cache_size=0` + `server_settings={'statement_timeout':'0'}`, ejecuta archivo SQL completo como UN solo `conn.execute(sql)`. El pooler no parsea statement por statement -> no hay timeouts per-row.

**Bug adicional encontrado en `gen_seed_sql.py`**: loop infinito cuando unique (project_id, worker_id) pairs disponibles < target=40. El while loop spinnea con `rng.choice` retries en duplicados, producia archivo SQL sin `COMMIT;` al final, y asyncpg hacia rollback silencioso al cerrar conexion.

**Fix**: pre-calcular todos los pares asignados, `rng.shuffle`, iterar hasta `min(40, len(all_pairs))`. Rompe cuando target alcanzado o pares agotados, COMMIT siempre se imprime.

**Datos seedeados finales (verificado con conexion fresca `scripts/check_seed.py`):**
- `mi-empresa` (34791eb6-e33e-4c75-bd4f-65b1fcc8f5cb): 3 proyectos, 20 workers, 37 evaluaciones
- `mi-empresa-23c437` (162e58e2-2530-4627-a0fa-9a5b5f824f14): 3 proyectos, 20 workers, 37 evaluaciones

**Nuevo archivo util**: `backend/scripts/check_seed.py` — verifica counts por org via asyncpg directo (bypassea SQLAlchemy session cache).

### Bloque 2: Incidente servidor wedged (resuelto con redeploy)
Al empezar la sesion, `https://faenascore-production.up.railway.app/` no cargaba (timeout 30s). Logs del container mostraban ultimo registro 2026-04-14 20:09:36 — el Uvicorn quedo wedged desde ayer por uno de los intentos fallidos del admin endpoint (loop de INSERTs largo bloqueo el event loop). Fix: `railway up --detach` levanto container nuevo y volvio a responder.

**Leccion**: endpoints HTTP no son buen lugar para batch largos. Si hace falta en el futuro -> Celery task o script standalone, nunca sincrono en request handler.

### Bloque 3: UserButton con logout en AppShell (commit 0d4c929)
Usuario reporto no ver opcion de logout. Agregado `<UserButton showName afterSignOutUrl="/">` en header de `frontend/src/components/layout/AppShell.tsx`. Muestra avatar + nombre + menu con profile y sign-out.

Usuario tambien pidio ver "creditos restantes". **Decision**: FaenaScore NO tiene sistema de creditos hoy. Pendiente definir modelo de negocio antes de implementar (ver seccion "Pendiente decisiones de producto").

### Bloque 4: Performance del Dashboard (commit 08e34b6)
Usuario reporto dashboard lento (5-6s). Root cause:
- `/stats`: 7 queries secuenciales (cada una await la anterior).
- `/top-workers`: 1 query + N+1 (un query rehire_yes por cada top worker, hasta 11 total).
- Total: 18+ round-trips al pooler de Supabase en sa-east-1 (~150-200ms c/u) + `statement_cache_size=0` fuerza re-parse cada vez.
- Ademas: Clerk JWKS verification + lazy-load del chunk Dashboard.

**Fix**: consolidar con `func.count(case(...))` para agregar conteos condicionales en la misma query.
- `/stats`: 7 -> 4 queries.
- `/top-workers`: 11 -> 1 query.
- `backend/app/api/v1/dashboard.py`: imports agregados `case`, removido loop N+1.
- Tests backend siguen pasando (21 OK).

**Resultado verificado por usuario**: dashboard ahora carga en ~3s (antes 5-6s).

**Palancas futuras si hace falta mas velocidad**:
1. Prefetch del chunk Dashboard al montar AppShell (~200-400ms).
2. HTTP cache `stale-while-revalidate` en `/stats` y `/top-workers`.
3. Pasar DATABASE_URL al session pooler (5432) para eliminar `statement_cache_size=0` overhead (mayor ganancia, requiere verificar IPv4 desde Railway).

### Bloque 5: Auditoria UX con Playwright (pendiente implementar)
Usuario pidio auditoria UX completa. Navegue landing (desktop 1440 + mobile 375), sign-in, y revise codigo de todas las paginas autenticadas (Dashboard, Workers, ProjectDetail, EvaluateWorker, Evaluate, Projects, WorkerDetail).

**NO se pudo probar flujo autenticado en vivo**: Playwright arranca sin sesion Clerk, no tengo credenciales. El analisis post-login es por lectura de codigo.

**Hallazgos organizados por prioridad** (lista completa abajo en seccion "UX audit — pendiente implementar").

**Top 5 recomendados para atacar primero (segun mi juicio UX)**:
1. **Clerk production instance + localizar sign-in a espanol**. Hoy hay banner "Development mode" y toda la UI del login en ingles. Mata credibilidad.
2. **EvaluateWorker debe mostrar nombre del trabajador y proyecto**. Hoy solo dice "Evaluar Trabajador". Riesgo de evaluar al equivocado en terreno.
3. **Toasts de error en lugar de `catch {}` silencioso** en Dashboard, Workers, Evaluate, ProjectDetail.
4. **Usar los Skeleton components (ya existen) en vez de "Cargando..." plain text** en Dashboard, Evaluate, ProjectDetail.
5. **Autosave a localStorage en EvaluateWorker** — supervisor pierde todo si se cae la senal en faena remota.

---

## UX audit — pendiente implementar (priorizado)

### P0 (matan credibilidad / bloquean uso)
1. **Clerk Development mode** visible en sign-in + UI en ingles. -> Upgrade a production instance, localizar con `localization={esES}`.
2. **EvaluateWorker.tsx sin nombre/proyecto del trabajador** en header. -> Mostrar nombre completo, RUT, especialidad, proyecto.
3. **`/sign-up` redirige al landing** — rompe funnel. -> Ruta `<SignUp>` de Clerk explicita + link desde sign-in.
4. **Errores silenciados con `catch {}`** en Dashboard, Workers, Evaluate, ProjectDetail. -> Toast de error + retry.

### P1 (friccion importante)
5. **Landing sin screenshots del producto** — solo texto + feature cards genericas con iconos lucide. -> Mockup hero + 2-3 capturas.
6. **Landing sin pricing** — duda sobre si es gratis para siempre. -> Seccion pricing o "Gratis / Pro proximamente".
7. **Skeleton.tsx existe pero NO se usa** en Dashboard, Evaluate, ProjectDetail. Muestra "Cargando..." texto plano. -> Reemplazar por Skeleton components.
8. **Scores sin escala explicita** ("3.9" sin /5). -> Mostrar "3.9 / 5" en KPIs y tooltip en stars.
9. **"62% recontrataria"** texto poco claro. -> "62% recomendaria recontratar" + tooltip con conteo absoluto.
10. **Evaluaciones recientes sin fecha/timestamp** en Dashboard. -> Mostrar "hace 2 dias".
11. **EvaluateWorker con typos**: "Recontratarias" (falta tilde + ¿?), "Evaluacion" (falta tilde). Boton disabled sin explicacion de por que. -> Tildes correctas + tooltip "Completa los 5 puntajes para guardar".
12. **Sin toast de exito al guardar evaluacion** — redirige silenciosamente. -> Toast "Evaluacion guardada — Sergio Diaz" con undo opcional.
13. **Workers sin paginacion visible** — hardcoded `size: 50`. -> Paginacion o "mostrando 50 de 127".
14. **Filtros activos sin chip/limpiar** — usuario olvida que filtro. -> Chips "Soldador ✕" arriba de resultados.
15. **EvaluateWorker: 5 dimensiones sin tooltip explicativo** — que significa "3 estrellas en Seguridad". -> Tooltip/leyenda "1=Muy malo, 5=Excelente".
16. **Sin guardar borrador** en EvaluateWorker. Supervisor pierde todo si se cae senal en mineria remota. -> Autosave a localStorage en cada cambio.

### P2 (pulido)
17. Landing mobile: hero subtitulo se corta raro en 3 lineas.
18. Footer sin links a terminos/privacidad/contacto.
19. ProjectDetail sin badge de estado (active/completed/cancelled).
20. WorkerDetail (347KB con Recharts) chunk grande. Reemplazar por spark SVG.
21. Evaluate page intermedia innecesaria (proyecto -> project detail -> evaluar).
22. Empty states sin CTA secundario (ej. "Sin evaluaciones" no linkea a Evaluar).
23. Sin breadcrumb navigation.
24. UserButton de Clerk sin localizar a espanol ("Manage account", "Sign out").

---

## Pendiente decisiones de producto (Gustavo/German)

1. **Modelo de monetizacion**: plan Free (limite evaluaciones/mes) vs Pro (ilimitadas). Precio. Creditos vs suscripcion. -> Sin esto no se implementa billing.
2. **Comprar dominio `faenascore.cl`** en NIC Chile (~$10k CLP/ano) — decision si reemplaza subdominio Railway.
3. **Landing page**: ¿pedir mockups/capturas del producto a disenador o usar screenshots reales?
4. **Launch strategy**: ¿demo 1:1 con contratistas conocidos de Gustavo, o landing publica + ads?
5. **Clerk production upgrade**: requiere configurar dominio propio para evitar el banner dev. ¿Esperamos a tener faenascore.cl o configurar en subdominio Railway?

---

## Archivos nuevos/modificados hoy

| Archivo | Cambio |
|---------|--------|
| `backend/scripts/exec_seed_sql.py` | NUEVO - ejecuta SQL seed via asyncpg con timeout=0 |
| `backend/scripts/check_seed.py` | NUEVO - verifica counts con conexion fresca asyncpg |
| `backend/scripts/gen_seed_sql.py` | FIX - loop infinito cuando pares insuficientes, ahora shuffle+iterate con break |
| `backend/app/api/v1/dashboard.py` | PERF - consolidacion queries via `func.count(case(...))` |
| `frontend/src/components/layout/AppShell.tsx` | FEAT - UserButton de Clerk con showName + afterSignOutUrl |
| `PROGRESS.md` | DOC - esta actualizacion |

## Commits del dia
- `07ffb29` feat: seed demo data script that bypasses pgbouncer timeouts
- `a13d683` fix: gen_seed_sql infinite loop when unique (project,worker) pairs < target
- `0d4c929` feat: add Clerk UserButton with name in AppShell header
- `08e34b6` perf: reduce dashboard backend queries from 18+ to 4

## Sesion 14 abr 2026 — Landing + features + quality
- **Landing page publica** en `/`, dashboard movido a `/app/*`, Clerk sign-in en `/sign-in`
  - `frontend/src/pages/Landing.tsx` con hero, problem, 6 features, CTA, footer
  - App.tsx reestructurado con SignedIn/SignedOut gate en `/app/*`
  - AppShell + todos los Link/navigate actualizados a `/app/*`
- **Seed demo script**: `backend/scripts/seed_demo.py` — 3 proyectos + 20 workers (RUTs validos) + ~40 evals
  - Uso: `python -m scripts.seed_demo --org-slug <slug>` o `--org-id <uuid>` + `--wipe` opcional
- **Edit forms**: NewProjectForm/NewWorkerForm aceptan `initial` -> modo edit. Boton Pencil en ProjectDetail y WorkerDetail
- **Evaluate next pending**: GET `/dashboard/next-evaluation` (pick proyecto activo con mas pendientes + primer worker). Banner en Dashboard con CTA
- **Export CSV workers**: GET `/workers/export.csv` (RUT, nombre, especialidad, telefono, email, activo, evaluaciones, score). Boton Download en Workers page
- **Fix apiFetch**: formatApiError aplana FastAPI detail=array a mensaje legible con campo
- **Code splitting**: lazy load paginas -> bundle inicial 722KB -> 281KB. Recharts (347KB) queda solo en WorkerDetail
- **Backend tests**: `tests/` con 21 tests unit (rut_validator + score_calculator) — `pytest -q` pasa

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
