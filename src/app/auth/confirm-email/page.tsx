'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmEmailPage() {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    const run = async () => {
      try {
        // 1) Query-Params
        let access_token = params.get('access_token') ?? undefined;
        let refresh_token = params.get('refresh_token') ?? undefined;
        const code = params.get('code') ?? undefined; // PKCE
        const token_hash = params.get('token_hash') ?? undefined; // email_change
        const type = params.get('type') ?? undefined;

        // 2) Hash-Params (Fallback)
        if (!access_token && !code && !token_hash) {
          const hash = window.location.hash;
          const h = new URLSearchParams(hash.replace('#', ''));
          access_token = access_token ?? h.get('access_token') ?? undefined;
          refresh_token = refresh_token ?? h.get('refresh_token') ?? undefined;
        }

        // A) Tokens direkt vorhanden -> Session setzen
        if (access_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token ?? ''
          });
          if (error) throw error;
          success();
          return;
        }

        // B) PKCE-Code -> Session tauschen
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          success();
          return;
        }

        // C) token_hash für email_change verifizieren (kein Login nötig)
        if (token_hash || type === 'email_change') {
          const { error } = await supabase.auth.verifyOtp({
            type: 'email_change',
            token_hash: token_hash ?? ''
          } as any);
          if (error) throw error;
          success();
          return;
        }

        throw new Error('No token found in URL');
      } catch (err: any) {
        console.error('Email confirmation error:', err);
        fail(err?.message ?? 'Confirmation failed');
      }
    };

    const success = () => {
      setStatus('success');
      toast.success('✅ Email confirmed successfully', {
        description: 'Redirecting to your account settings...',
        duration: 4000
      });
      setTimeout(
        () => router.replace('/dashboard/settings?email-updated=1'),
        2000
      );
    };

    const fail = (msg: string) => {
      setStatus('error');
      toast.error('❌ Confirmation failed', {
        description: msg,
        duration: 5000
      });
      setTimeout(() => router.replace('/dashboard/settings'), 2500);
    };

    run();
  }, [params, router, supabase]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-3 text-center'>
      {status === 'loading' && (
        <>
          <Loader2 className='text-muted-foreground mb-2 h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>
            Confirming your new email…
          </p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className='mb-2 h-10 w-10 text-emerald-500' />
          <p className='font-medium'>Email confirmed!</p>
          <p className='text-muted-foreground text-sm'>
            Redirecting to settings…
          </p>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className='mb-2 h-10 w-10 text-red-500' />
          <p className='font-medium'>Something went wrong</p>
          <p className='text-muted-foreground text-sm'>
            You’ll be redirected shortly.
          </p>
        </>
      )}
    </div>
  );
}
