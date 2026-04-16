import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { esES } from '@clerk/localizations'
import './index.css'
import App from './App'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || ''
const isMockAuth = import.meta.env.VITE_AUTH_MOCK_ENABLED === 'true'

function Root() {
  if (isMockAuth || !clerkPubKey) {
    return (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey} localization={esES}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ClerkProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
