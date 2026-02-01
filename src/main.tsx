import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'leaflet/dist/leaflet.css';
import App from './App.tsx'

console.log("%c [APP v1.2.6] Loaded at " + new Date().toLocaleTimeString(), "background: #222; color: #bada55; padding: 10px; font-weight: bold;");
(window as any).APP_VERSION = "1.2.6";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
