# Discusión de naming — FaenaScore

**Fecha**: 2026-04-17
**Estado**: Decisión pendiente. Producto pre-launch (sin clientes pagando, sin dominio comprado). Momento óptimo para rebrand si se decide cambiar.

---

## Contexto

FaenaScore es un sistema de evaluación de desempeño para trabajadores temporales de faena en minería y construcción (Chile). Target: contratistas, supervisores, jefes de obra.

El nombre actual funciona por contexto (FAENA + SCORE → evaluar trabajadores de faena), pero se cuestionó si **"Score"** es natural en el vocabulario chileno para el acto de evaluar personas.

---

## Análisis del término "Score" en Chile

En Chile "score" tiene UN ancla fuerte: **Dicom / score crediticio**. Fuera de ese contexto, para evaluar personas el lenguaje natural es:

- **puntaje** (neutro, universal)
- **nota** (lenguaje escolar / coloquial)
- **calificación** (formal / RRHH)
- **evaluación** (formal)

Un capataz NO dice "voy a ponerle score al Juan". Dice "voy a ponerle nota" / "voy a evaluarlo" / "a sacarle la ficha".

**Conclusión**: "Score" se entiende por contexto pero no por familiaridad directa. Suena a SaaS importado / corporativo-gringo. Tolerable en B2B moderno chileno (Buk, Rankmi, Talana lo usan), pero pierde localidad con target old-school de regiones mineras.

---

## 10 alternativas consideradas

| Nombre | Pro | Contra |
|---|---|---|
| **FaenaScore** (actual) | Descriptivo, activos ya creados, dominio considerado | "Score" anglicismo, sabor a software genérico |
| **ObraScore** | Cubre construcción + minería | Mismo problema que FaenaScore |
| **Cuadrilla** | 100% chileno, memorable, marca con alma, extensible | No describe qué hace, necesita tagline fuerte |
| **Recontrata** | Nombre = propuesta de valor | Limita scope al acto de recontratar |
| **TerrenoScore** | "En terreno" es jerga del supervisor | Mismo "Score" anglicismo |
| **FichaObra** | "Ficha" es lenguaje del rubro | "Obra" deja fuera minería-puramente-operacional |
| **MaestroRank** | "Maestro" = trabajador calificado | Excluye peoneta / jornalero / ayudante |
| **BuenaMano** | Memorable, juego con "mano de obra" | Demasiado "cute" para rubro minero/construcción rudo |
| **FaenaCheck** | Acción (verificar) | Genérico |
| **Andanza** | Marca pura, personalidad | Opaca, necesita mucha explicación |
| **HojaDeVida** | Literal (CV en Chile) | Se confunde con plataforma tipo LinkedIn |

### Descartados de los alternativos "ChilenoScore"
- **FaenaNota**: correcto pero suena pueril ("notita del trabajador"), pierde seriedad minera
- **FaenaPuntaje**: se alarga feo
- **Puntafaena**: suena raro
- **Califaena**: tropieza fonéticamente

---

## Recomendación final: **FichaFaena**

### Razones (por orden de peso)

1. **"Ficha" es lenguaje real del rubro.** El jefe de obra dice "sáqueme la ficha del Juan", no "el score". Ficha médica, ficha del trabajador, ficha policial — la palabra ya carga peso documental en Chile.

2. **Suena a registro oficial, no a app.** Contratistas de minería desconfían de "software moderno". Una ficha se siente como algo que ya deberían tener.

3. **Extensible sin rebrand futuro.** Si mañana se agregan asistencia, turnos, certificaciones, contratos → todo cabe en "ficha". "Score" encasilla en puntuación.

4. **Cero anglicismo, cero explicación.** Un capataz de Calama lo entiende en 2 segundos.

5. **Momento óptimo para cambiar.** Pre-launch, sin clientes pagando, sin dominio comprado. El costo del rebrand hoy es bajo; en 6 meses con clientes es alto.

### Segunda preferencia: **Cuadrilla**
- Mejor como marca pura, con personalidad y extensibilidad máxima.
- Contra: necesita marketing para asociarla al producto. No encaja con estrategia de venta 1:1 actual (Gustavo + red de contactos). Óptimo si hay budget de branding.

### Tercera preferencia: **Mantener FaenaScore**
- Válido si no se quiere invertir tiempo en rebrand.
- Costo del cambio: ~2-3 horas limpias (header, landing, emails, páginas legales, screenshots, repo rename).
- Paga solo si hay convicción.

---

## Impacto del rebrand (si se ejecuta)

### Archivos a tocar
- `frontend/src/pages/Landing.tsx` — hero, header, footer, meta
- `frontend/index.html` — title, meta description
- `frontend/src/components/layout/AppShell.tsx` — logo/nombre
- `frontend/src/pages/Terms.tsx` + `Privacy.tsx` — referencias a "FaenaScore"
- `backend/app/core/config.py` — nombre en emails/API responses si lo hay
- `PROGRESS.md` — header
- `README.md` — si existe
- Screenshot del dashboard (`frontend/public/dashboard-preview.png`) — logo en header

### Infra
- **Dominio**: verificar disponibilidad de `fichafaena.cl` en NIC Chile (~$10k CLP/año)
- **Repo GitHub**: `German-Faymex/FaenaScore` → `German-Faymex/FichaFaena` (rename mantiene redirects)
- **Railway project**: renombrar `faenascore` → `fichafaena` (URL pasa a `fichafaena-production.up.railway.app`)
- **Clerk application**: renombrar en dashboard (no afecta keys)
- **Supabase**: no cambia (project ref es interno)
- **Email**: `contacto@faenascore.cl` → `contacto@fichafaena.cl`

### Costo estimado de rebrand
- **Tiempo de dev**: 2-3 horas
- **Tiempo de infra**: 30 min (Railway rename, DNS si aplica)
- **Costo monetario**: $10k CLP/año (dominio)
- **Riesgo**: bajo (producto sin clientes activos)

---

## Decisión

**Pendiente por Germán.**

Opciones concretas:

1. ✅ **Rebrand a FichaFaena** — acción recomendada. 2-3h de trabajo, ventana óptima.
2. ⏸️ **Mantener FaenaScore** — no hacer nada, seguir con el plan actual.
3. 🎨 **Rebrand a Cuadrilla** — solo si hay intención de invertir en marketing de marca a mediano plazo.

---

## Caveat importante

Este análisis asume que la decisión es **sólo marca**. Si FaenaScore ya fue compartido con prospectos (Gustavo, contratistas conocidos) y empezó a ganar reconocimiento boca-a-boca, **el costo intangible de cambiar sube**. Verificar antes de ejecutar.
