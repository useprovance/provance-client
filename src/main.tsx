import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { PrivyProvider } from '@privy-io/react-auth'
import { queryClient } from './lib/queryClient'
import { wagmiConfig, goatNetwork, arcNetwork } from './lib/wagmi'
import { base, mainnet } from 'viem/chains'
import { env } from './utils/env.utils'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={env.VITE_PRIVY_APP_ID}
      config={{
        supportedChains: [goatNetwork, arcNetwork, base, mainnet],
      }}
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </PrivyProvider>
  </StrictMode>,
)
