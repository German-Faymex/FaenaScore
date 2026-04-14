import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, useAuth } from '@clerk/clerk-react'
import { OrgProvider } from './lib/org'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
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

function ProtectedApp() {
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
      </Routes>
    </OrgProvider>
  )
}

function AuthenticatedApp() {
  const { getToken } = useAuth()
  setAuthTokenGetter(() => getToken())
  return <ProtectedApp />
}

export default function App() {
  if (!clerkEnabled) {
    return (
      <Routes>
        <Route path="/" element={<Landing isSignedIn={true} />} />
        <Route path="/app/*" element={<ProtectedApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SignedIn>
              <Landing isSignedIn={true} />
            </SignedIn>
            <SignedOut>
              <Landing isSignedIn={false} />
            </SignedOut>
          </>
        }
      />
      <Route
        path="/sign-in/*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" afterSignInUrl="/app" afterSignUpUrl="/app" />
          </div>
        }
      />
      <Route
        path="/app/*"
        element={
          <>
            <SignedIn>
              <AuthenticatedApp />
            </SignedIn>
            <SignedOut>
              <Navigate to="/sign-in" replace />
            </SignedOut>
          </>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
