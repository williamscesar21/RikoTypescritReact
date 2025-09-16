import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Forzar canal production (no muestra banner de test)
CapacitorUpdater.setChannel({ channel: 'production' });

CapacitorUpdater.notifyAppReady();

if (Capacitor.isNativePlatform()) {
  // Ocultar completamente la barra de estado
  StatusBar.hide();

  // Si prefieres mostrarla pero transparente:
  // StatusBar.setStyle({ style: Style.Light });
  // StatusBar.setBackgroundColor({ color: 'transparent' });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
