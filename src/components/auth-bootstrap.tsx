'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * ✅ Fixed version of auth-bootstrap
 * - Ensures `user_roles` entry exists
 * - DOES NOT overwrite existing roles or ban states
 */
export default function AuthBootstrap() {
  const supabase = createClient();

  useEffect(() => {
    const bootstrap = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) return;

      // Check if user_roles already exists
      const { data: existing, error: fetchErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchErr) {
        console.error('❌ Failed to check user_roles:', fetchErr);
        return;
      }

      // If entry already exists, do nothing
      if (existing) {
        console.log('ℹ️ user_roles already exists — skipping bootstrap');
        return;
      }

      // Otherwise, create a new entry with safe defaults
      console.log('🆕 Creating user_roles entry for new user');
      const { error: insertErr } = await supabase.from('user_roles').insert([
        {
          user_id: user.id,
          role: 'viewer',
          banned: false,
          approved: false
        }
      ]);

      if (insertErr) {
        console.error('❌ Failed to insert user_roles:', insertErr);
      } else {
        console.log('✅ user_roles initialized for', user.email);
      }
    };

    bootstrap();
  }, [supabase]);

  return null;
}
