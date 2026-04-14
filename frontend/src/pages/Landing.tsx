import { Link } from 'react-router-dom'
import { ClipboardCheck, TrendingUp, History, ShieldCheck, Zap, Users } from 'lucide-react'

interface LandingProps {
  isSignedIn: boolean
}

export default function Landing({ isSignedIn }: LandingProps) {
  const primaryCta = isSignedIn
    ? { to: '/app', label: 'Ir al Dashboard' }
    : { to: '/sign-in', label: 'Empezar gratis' }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">FaenaScore</h1>
          <Link
            to={primaryCta.to}
            className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {primaryCta.label}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24 text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 tracking-tight">
          Evalúa a tus trabajadores de faena.
          <br className="hidden md:block" />
          <span className="text-blue-600"> Nunca más recontrates al equivocado.</span>
        </h2>
        <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
          La herramienta mobile-first para contratistas de minería y construcción.
          Decisiones de recontratación basadas en datos, no en memoria o WhatsApp.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to={primaryCta.to}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            {primaryCta.label}
          </Link>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Ver cómo funciona
          </a>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 md:px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900">
            Más de 1 millón de trabajadores subcontratados en Chile.
          </h3>
          <p className="mt-4 text-lg text-gray-600">
            La mayoría de los contratistas decide recontratar por WhatsApp, listas de Excel
            dispersas y memoria del supervisor. Resultado: el mismo trabajador problemático
            vuelve en la siguiente faena.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <h3 className="text-2xl md:text-3xl font-bold text-gray-900 text-center">
          Evaluación rápida. Decisión informada.
        </h3>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={ClipboardCheck}
            title="Evaluaciones en segundos"
            body="5 dimensiones (calidad, seguridad, puntualidad, equipo, técnica) + recomendación de recontratación. Desde el celular, en terreno."
          />
          <FeatureCard
            icon={TrendingUp}
            title="Score promedio por trabajador"
            body="Cada trabajador acumula historial a través de proyectos. Ordena, filtra y encuentra a los mejores en segundos."
          />
          <FeatureCard
            icon={History}
            title="Historial por proyecto"
            body="Quién trabajó dónde, con qué desempeño. Importa tu base desde Excel y empieza hoy."
          />
          <FeatureCard
            icon={ShieldCheck}
            title="Datos seguros por empresa"
            body="Multi-tenant con aislamiento por organización. Tus datos no se cruzan con otros contratistas."
          />
          <FeatureCard
            icon={Zap}
            title="Mobile-first"
            body="Diseñado para usarse en el celular del supervisor. Funciona desde 375px de ancho."
          />
          <FeatureCard
            icon={Users}
            title="Importación masiva"
            body="Sube tu planilla de trabajadores en Excel o CSV. RUT validado automáticamente."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white">
            Empieza a construir tu base de datos de trabajadores hoy.
          </h3>
          <p className="mt-4 text-blue-100 text-lg">
            Crea tu organización gratis. Sin tarjeta de crédito.
          </p>
          <Link
            to={primaryCta.to}
            className="mt-8 inline-block px-8 py-3 rounded-lg bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors"
          >
            {primaryCta.label}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>© {new Date().getFullYear()} FaenaScore. Hecho en Chile.</p>
          <p>Para contratistas de minería y construcción.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
        <Icon className="w-5 h-5" />
      </div>
      <h4 className="mt-4 font-semibold text-gray-900">{title}</h4>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{body}</p>
    </div>
  )
}
