import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react'
import { OrgProvider } from './lib/org'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Workers from './pages/Workers'
import WorkerDetail from './pages/WorkerDetail'
import Evaluate from './pages/Evaluate'
import EvaluateWorker from './pages/EvaluateWorker'
import { setAuthTokenGetter } from './lib/api'

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) &&
  import.meta.env.VITE_AUTH_MOCK_ENABLED !== 'true'

function AppRoutes() {
  return (
    <OrgProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="workers" element={<Workers />} />
          <Route path="workers/:id" element={<WorkerDetail />} />
          <Route path="evaluate" element={<Evaluate />} />
          <Route path="evaluate/:projectId/:workerId" element={<EvaluateWorker />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </OrgProvider>
  )
}

function AuthenticatedApp() {
  const { getToken } = useAuth()
  useEffect(() => {
    setAuthTokenGetter(() => getToken())
  }, [getToken])
  return <AppRoutes />
}

export default function App() {
  if (!clerkEnabled) {
    return <AppRoutes />
  }

  return (
    <>
      <SignedIn>
        <AuthenticatedApp />
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
