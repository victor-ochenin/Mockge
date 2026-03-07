import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

console.log('[Clerk Debug] Publishable Key:', PUBLISHABLE_KEY ? `${PUBLISHABLE_KEY.substring(0, 15)}...` : 'NOT SET')
console.log('[Clerk Debug] Key starts with pk_test_:', PUBLISHABLE_KEY?.startsWith('pk_test_'))

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

// Компонент для проверки инициализации Clerk
function ClerkInitCheck() {
  const { isLoaded, isSignedIn } = useAuth()

  useEffect(() => {
    console.log('[Clerk Init] isLoaded:', isLoaded, 'isSignedIn:', isSignedIn)
  }, [isLoaded, isSignedIn])

  if (!isLoaded) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace', textAlign: 'center' }}>
        <h3>Clerk загружается...</h3>
        <p>isLoaded: {String(isLoaded)}</p>
      </div>
    )
  }

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <ClerkInitCheck />
    </ClerkProvider>
  </StrictMode>,
)
