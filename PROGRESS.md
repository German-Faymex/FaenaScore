# FaenaScore — Progreso de Desarrollo

## Ultima actualizacion: 2026-04-11T18:35:00-04:00

## Estado actual
- Fase: MVP Semana 1 completada
- Branch activo: master
- Ultimo commit: 8a878c9 — fix: add OrgProvider context for auto org detection
- Repo: https://github.com/German-Faymex/FaenaScore

## Resumen del dia 11 de abril 2026

### Sesion 1: Investigacion y seleccion de idea (3+ horas)

1. **Leimos documento "Investigacion Micro-SaaS IA Abril 2026"** (12 ideas evaluadas)
2. **Investigacion profunda de RecibosAI**: Descartada (score real 5/10). Boleta electronica obligatoria en Chile desde 2021, SII ya tiene toda la data en XML, Nubox/Defontana/SyncManager ya resuelven esto.
3. **Investigacion de las 11 ideas restantes** con 5 agentes en paralelo:
   - **FotoListo**: DESCARTADO (3/10) — MeLi ya ofrece gratis fotos IA, titulos, descripciones, Mercado Clips
   - **ContractSnap**: DESCARTADO (4/10) — 7+ competidores chilenos (Magnar con inversion de Carey, Cicero, Spektr)
   - **ExtractaBank**: DESCARTADO (3/10) — Open Banking llega julio 2026, Fintoc/Floid ya tienen APIs, CartolaSimple es gratis
   - **CalificaRapido**: POSIBLE (6.5/10) — gap real pero OCR manuscrito 7.66% error, profesores pagan poco
   - **LicitaDoc**: RECOMENDADO (8.5/10) — nadie genera propuestas tecnicas en Chile, LicitaLAB valido mercado con 1000 clientes
   - **AcreditaMinero**: RECOMENDADO (8/10) — gestion acreditacion contratistas, dolor mensual, mercado con dinero
   - **ArriendoFacil**: POSIBLE (7.5/10) — corredores independientes, boring business con volumen
4. **Investigacion profunda de EvalPro** (pivoteado a FaenaScore):
   - German identifico que el dolor real NO es evaluaciones de oficina, sino decisiones de recontratacion de trabajadores temporales de faena
   - 1,071,128 subcontratados en Chile, 55-60% de fuerza minera es contratista
   - Construccion tiene 50% rotacion — la peor de todos los sectores
   - CERO competencia directa en Chile/LATAM para evaluacion de trabajadores temporales
   - Score final: 8.5/10
5. **Informe de justificacion** guardado en `JUSTIFICACION_FAENASCORE.md`

### Sesion 2: Planificacion (1 hora)

6. **Plan de implementacion aprobado** — 3 semanas, backend + frontend + deploy
7. Exploramos patrones de 5 proyectos existentes:
   - CasiListo/Fillanyform (backend + frontend patterns)
   - Dashboard Prevencion de Riesgo (worker tracking, KPIs, Recharts)
   - Agenda Sala Faymex (RBAC, Excel import, Dockerfile multi-stage)
   - WhatsApp Bot Faymex (alertas Meta Cloud API)

### Sesion 3: Construccion backend (2 horas)

8. **Backend completo** — FastAPI con 29 endpoints:
   - 6 modelos SQLAlchemy: Organization, User, OrgMember, Project, Worker, ProjectWorker, Evaluation
   - 7 routers API: health, auth, organizations, projects, workers, evaluations, dashboard
   - 5 schemas Pydantic con validacion (RUT modulo 11)
   - Servicios: rut_validator, score_calculator
   - Clerk JWT auth con mock mode
   - Alembic async configurado
   - Worker import Excel/CSV con openpyxl
   - Cuadrilla Builder: busqueda por especialidad + score minimo
   - Dashboard: KPIs, top workers, evaluaciones recientes
9. **Verificado**: App carga 29 rutas, requiere SQLAlchemy >= 2.0.40 para Python 3.14

### Sesion 4: Construccion frontend (1.5 horas)

10. **Frontend completo** — React 19 + TypeScript + Tailwind v4 + Recharts:
    - 7 paginas: Dashboard, Projects, ProjectDetail, Workers, WorkerDetail, Evaluate, EvaluateWorker
    - Componentes: AppShell (sidebar responsive), StarRating (touch 44px+), ScoreBadge (color-coded)
    - API client tipado (api.ts) con todas las funciones
    - OrgProvider context para auto-deteccion de organizacion
    - Clerk auth condicional con mock mode
    - Build verificado: compila sin errores TypeScript

### Sesion 5: Testing E2E (1 hora)

11. **PostgreSQL local** levantado con Docker Compose (puerto 5433)
12. **Alembic migration** generada y aplicada — 6 tablas creadas
13. **Test API con curl** — flujo completo verificado:
    - Crear org "Faymex SpA"
    - Crear proyecto "Mantencion Molino SAG" (Minera Escondida, Antofagasta)
    - Crear 3 trabajadores con RUT validado
    - Asignar a proyecto
    - Evaluar Juan Perez (4.6, Si) y Maria Lopez (3.0, Reservas)
    - Dashboard stats: 3.8 promedio, 50% rehire
    - Cuadrilla Builder: filtrar soldadores score >= 4 → Juan Perez
14. **Test UI con Playwright** — flujo completo verificado:
    - Dashboard con KPIs y datos reales
    - Tabla trabajadores con scores color-coded
    - Detalle trabajador con estrellas, recontratacion, historial
    - Proyecto con equipo y banner "sin evaluar"
    - Formulario evaluacion: 5 estrellas + rehire "No" + motivo + comentario → guardo exitoso
    - Dashboard actualizado: 3 evals, score 3.6, 33% rehire
15. **Repo GitHub** creado y pusheado: https://github.com/German-Faymex/FaenaScore

## Archivos clave

| Archivo | Descripcion |
|---------|-------------|
| `JUSTIFICACION_FAENASCORE.md` | Informe de por que elegimos FaenaScore |
| `backend/app/main.py` | FastAPI app, 29 rutas |
| `backend/app/models/` | 6 modelos SQLAlchemy |
| `backend/app/api/v1/workers.py` | Cuadrilla Builder + import Excel |
| `backend/app/api/v1/evaluations.py` | Evaluaciones + batch |
| `backend/app/services/rut_validator.py` | Validacion RUT chileno modulo 11 |
| `frontend/src/pages/EvaluateWorker.tsx` | Formulario mobile-first (pagina critica) |
| `frontend/src/pages/Workers.tsx` | Cuadrilla Builder UI |
| `frontend/src/pages/WorkerDetail.tsx` | Perfil con scores + Recharts + historial |
| `frontend/src/components/ui/StarRating.tsx` | Estrellas touch con colores |
| `frontend/src/lib/org.tsx` | OrgProvider context |
| `frontend/src/lib/api.ts` | API client tipado |

## Decisiones tomadas

| Decision | Razon |
|----------|-------|
| Single Dockerfile multi-stage | Patron Agenda Sala, un solo servicio Railway |
| No Celery/Redis/S3 | Innecesario para MVP, todo es CRUD sincrono |
| SQLAlchemy >= 2.0.40 | Compatibilidad Python 3.14 (bug con Union types) |
| PostgreSQL puerto 5433 | Puerto 5432 ocupado por container Fillanyform |
| OrgProvider auto-create | Primera vez crea org "Mi Empresa", simplifica onboarding |
| score_average pre-computado | Almacenado en tabla evaluations para queries rapidos |
| Multi-tenant org_id en URLs | Preparado para multiples clientes desde dia 1 |
| Estrellas 44px+ tap targets | Mobile-first, evaluacion en terreno con celular |

## Proximos pasos (para manana)

### Prioridad 1: Funcionalidad faltante
1. **Formulario crear proyecto** — el boton "Nuevo Proyecto" no abre formulario aun
2. **Formulario crear trabajador** — el boton "Nuevo" no abre formulario aun
3. **Worker import modal** — subir Excel desde el frontend
4. **Asignar workers a proyecto** — UI para seleccionar workers y asignarlos

### Prioridad 2: Polish UI
5. **Mobile responsive test** — probar con viewport 375px en Playwright
6. **Empty states mejorados** — cuando no hay org, guiar al usuario
7. **Loading skeletons** — reemplazar "Cargando..." con skeleton loaders
8. **Titulo de pagina** — cambiar "frontend" por "FaenaScore" en index.html

### Prioridad 3: Deploy produccion
9. **Supabase PostgreSQL** — crear DB de produccion
10. **Clerk produccion** — crear app Clerk, configurar keys
11. **Railway deploy** — push y verificar
12. **Dominio** — considerar faenascore.cl o similar

### Prioridad 4: Features fase 2
13. **Filtro por especialidad** en pagina Evaluate (no solo en Workers)
14. **Batch evaluation** — evaluar multiples workers en secuencia sin salir
15. **Export CSV** de trabajadores con scores
16. **Notificaciones WhatsApp** de certificaciones por vencer

## Problemas conocidos
- `index.html` title dice "frontend" en vez de "FaenaScore" (cosmético)
- Botones "Nuevo Proyecto" y "Nuevo Trabajador" no tienen formulario modal aun (solo navegan)
- No hay forma de asignar workers a proyecto desde el UI (solo via API)
- No hay validacion de motivo requerido cuando would_rehire != 'yes' en frontend (backend lo acepta null)

## Infraestructura local
- Backend: `cd backend && python -m uvicorn app.main:app --port 8001`
- Frontend: `cd frontend && npx vite --port 5180`
- PostgreSQL: `docker compose up -d` (puerto 5433)
- Vite proxy apunta a localhost:8001
