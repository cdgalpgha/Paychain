import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { config } from './wagmi'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css'
import './animations.css'

const queryClient = new QueryClient()

function Root() {
  const [showApp, setShowApp] = useState(false);

  if (!showApp) {
    return <LandingPage onLaunch={() => setShowApp(true)} />;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
