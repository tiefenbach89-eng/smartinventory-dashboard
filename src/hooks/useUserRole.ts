'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUserRole() {
  const supabase = createClient();
  const [role, setRole] = useState('viewer');
  const [approved, setApproved] = useState(false);
  const [banned, setBanned] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      try {
        setLoading(true);
        setError(null);

        // 🔹 Session abfragen (sicherer als getUser)
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const user = sessionData?.session?.user;
        if (!user) {
          setRole('guest');
          setLoading(false);
          return;
        }

        // 🔹 Email-Verifizierung prüfen
        setEmailVerified(!!user.email_confirmed_at);

        // 🔹 Rolleninfos laden
        const {
          data,
          error: roleError,
          status
        } = await supabase
          .from('user_roles')
          .select('role, approved, banned')
          .eq('user_id', user.id)
          .maybeSingle();

        // Wenn leere Antwort, kein Fehler
        if (status === 406 || !data) {
          console.warn(
            '⚠️ Kein user_roles-Eintrag gefunden – nutze Standardwerte'
          );
          setRole('viewer');
          setApproved(false);
          setBanned(true);
          return;
        }

        if (roleError) throw roleError;

        setRole(data.role ?? 'viewer');
        setApproved(!!data.approved);
        setBanned(!!data.banned);
      } catch (err: any) {
        console.error('❌ useUserRole error:', err);
        setError(err.message);
        // Fallback
        setRole('viewer');
        setApproved(false);
        setBanned(true);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, []);

  return { role, approved, banned, emailVerified, loading, error };
}
