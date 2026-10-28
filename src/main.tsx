import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { PrivyProvider } from '@privy-io/react-auth'
import { queryClient } from './lib/queryClient'
import { env } from './utils/env.utils'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider appId={env.VITE_PRIVY_APP_ID}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </PrivyProvider>
  </StrictMode>,
)
