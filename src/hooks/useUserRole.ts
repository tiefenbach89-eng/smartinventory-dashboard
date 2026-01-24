'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/lib/permissions';

type AppRole = Role | 'unknown';

type UserRoleState = {
  role: AppRole;
  approved: boolean;
  banned: boolean;
  emailVerified: boolean;
  loading: boolean;
  error: string | null;
};

export function useUserRole(): UserRoleState {
  const supabase = createClient();

  const [state, setState] = useState<UserRoleState>({
    role: 'employee',
    approved: false,
    banned: false,
    emailVerified: false,
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;

    const loadUserRole = async () => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        // 1) User holen
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError) {
          console.error('❌ Failed to get user:', userError);
          if (!isMounted) return;
          setState((prev) => ({
            ...prev,
            loading: false,
            error: userError.message ?? 'Failed to get user'
          }));
          return;
        }

        if (!user) {
          if (!isMounted) return;
          setState((prev) => ({
            ...prev,
            role: 'unknown',
            approved: false,
            banned: false,
            emailVerified: false,
            loading: false
          }));
          return;
        }

        // 2) user_roles EINLESEN (ohne email_verified!)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role, approved, banned')
          .eq('user_id', user.id)
          .maybeSingle();

        // ❗ Fehlerbehandlung verbessern
        if (error && error.code !== 'PGRST116') {
          console.error('❌ Failed to fetch user_roles:', error);
          if (!isMounted) return;
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error.message ?? 'Failed to fetch user role'
          }));
          return;
        }

        // 3) Fallback-Rolle
        let role: AppRole = 'employee';

        if (
          data?.role === 'admin' ||
          data?.role === 'manager' ||
          data?.role === 'operator' ||
          data?.role === 'employee'
        ) {
          role = data.role;
        }

        const approved = data?.approved ?? false;
        const banned = data?.banned ?? false;

        const emailVerified = !!user.email_confirmed_at;

        if (!isMounted) return;
        setState({
          role,
          approved,
          banned,
          emailVerified,
          loading: false,
          error: null
        });
      } catch (err: any) {
        console.error('❌ Unexpected error while loading user role:', err);
        if (!isMounted) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message ?? 'Unexpected error while loading user role'
        }));
      }
    };

    loadUserRole();
    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return state;
}
