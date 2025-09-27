// src/main.tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

const VERSION_MANIFEST_URL =
  'https://drive.google.com/uc?export=download&id=1E46tjIZON9euTlbmy0WR2qfBSbT9pDIW';


async function runOtaUpdate() {
  if (!Capacitor.isNativePlatform()) return; // Sólo en Android/iOS

  try {
    // Paso clave: confirma que el bundle *actual* arrancó bien
    await CapacitorUpdater.notifyAppReady();
  } catch (e) {
    console.warn('notifyAppReady() warning:', e);
  }

  try {
    // --- Estrategia con manifest remoto ---
    // El manifest debe responder: { "version": "1.0.1", "url": "https://..." }
    const res = await fetch(VERSION_MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo descargar el manifest');
    const manifest = (await res.json()) as { version: string; url: string };

    if (!manifest?.version || !manifest?.url) {
      console.warn('Manifest inválido, omito update.');
      return;
    }

    // Descarga el ZIP y registra la versión
    const version = await CapacitorUpdater.download({
      version: manifest.version,
      url: manifest.url,
      // checksum: 'sha256:...',        // (opcional) si generas checksum
      // headers: { Authorization: ... } // (opcional) si tu hosting lo requiere
    });

    // Activa la versión (la app se reinicia al aplicar el bundle)
    await CapacitorUpdater.set(version);
  } catch (e) {
    // Si algo falla, la app sigue con el bundle empaquetado
    console.warn('OTA update falló o no aplica:', e);
  }
}

function Root() {
  useEffect(() => {
    // StatusBar nativo
    if (Capacitor.isNativePlatform()) {
      StatusBar.hide().catch(() => {});
      // Si quisieras barra visible/transparente:
      // import { Style } from '@capacitor/status-bar';  // y luego:
      // StatusBar.setStyle({ style: Style.Light });
      // StatusBar.setBackgroundColor({ color: 'transparent' });
    }

    // Ejecuta el flujo OTA (Capgo + Drive)
    runOtaUpdate();
  }, []);

  return (
    <StrictMode>
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);
