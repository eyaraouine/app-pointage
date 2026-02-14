import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css';
import App from './App'

console.log("%c [APP v2.0.7] Loaded at " + new Date().toLocaleTimeString(), "background: #222; color: #00ff00; padding: 10px; font-weight: bold;");
(window as any).APP_VERSION = "2.0.7";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
