import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
import './index.css'
import App from './App.jsx'
import SurfaceGallery from './dev/SurfaceGallery.jsx'

inject()
injectSpeedInsights()

document.addEventListener('contextmenu', e => e.preventDefault())

const isDevSurfaces = new URLSearchParams(window.location.search).get('dev') === 'surfaces'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDevSurfaces ? <SurfaceGallery /> : <App />}
  </StrictMode>,
)
