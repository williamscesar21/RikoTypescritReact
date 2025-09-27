// src/main.tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

function Root() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Ocultar la status bar (opcional)
      StatusBar.hide().catch(() => {});

      // Notifica que la app arrancó bien → evita rollback
      CapacitorUpdater.notifyAppReady().catch(console.warn);
    }
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
