import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { PrivyProvider } from '@privy-io/react-auth'
import { queryClient } from './lib/queryClient'
import { wagmiConfig, goatNetwork } from './lib/wagmi'
import { env } from './utils/env.utils'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PrivyProvider appId={env.VITE_PRIVY_APP_ID} config={{ supportedChains: [goatNetwork] }}>
          <App />
        </PrivyProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
