'use client';

import { useEffect } from 'react';

const APP_VERSION = '1.0.0'; // <– Erhöhe, wenn du CSS/Layout/Supabase änderst

export function AppVersionGuard() {
  useEffect(() => {
    try {
      const storedVersion = localStorage.getItem('app_version');

      if (storedVersion !== APP_VERSION) {
        console.warn(
          '%c⚠️ App version changed! Clearing cache...',
          'color: orange; font-weight: bold;'
        );

        // 1️⃣ Local + Session Storage löschen
        localStorage.clear();
        sessionStorage.clear();

        // 2️⃣ Cookies löschen
        document.cookie.split(';').forEach((c) => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(
              /=.*/,
              '=;expires=' + new Date().toUTCString() + ';path=/'
            );
        });

        // 3️⃣ Neue Version speichern
        localStorage.setItem('app_version', APP_VERSION);

        // 4️⃣ Seite neu laden
        window.location.reload();
      }
    } catch (err) {
      console.error('Version guard error:', err);
    }
  }, []);

  return null;
}
