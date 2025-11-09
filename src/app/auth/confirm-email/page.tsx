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
        // 1️⃣ Parameter erfassen
        const type = params.get('type') ?? 'email_change';
        const code = params.get('code') ?? '';
        const token_hash = params.get('token_hash') ?? '';
        const access_token = params.get('access_token') ?? '';

        console.log('🔍 Params:', { type, code, token_hash, access_token });

        // 2️⃣ Wenn Access Token vorhanden → Session setzen
        if (access_token) {
          const { error } = await supabase.auth.setSession({
            access_token,
            refresh_token: ''
          });
          if (error) throw error;
          return handleSuccess();
        }

        // 3️⃣ Wenn Code vorhanden → Versuche PKCE-Exchange (Standardweg)
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!error) return handleSuccess();
          console.warn(
            '⚠️ exchangeCodeForSession failed, fallback to verifyOtp',
            error.message
          );
        }

        // 4️⃣ Fallback für Email-Change über verifyOtp
        const { error } = await supabase.auth.verifyOtp({
          type: 'email_change',
          token_hash: token_hash || code
        } as any);

        if (error) throw error;

        handleSuccess();
      } catch (err: any) {
        console.error('❌ Confirm error:', err);
        handleError(err.message || 'Confirmation failed');
      }
    };

    const handleSuccess = () => {
      setStatus('success');
      toast.success('✅ Email confirmed successfully', {
        description: 'Redirecting to your settings...',
        duration: 4000
      });
      setTimeout(
        () => router.replace('/dashboard/settings?email-updated=1'),
        2000
      );
    };

    const handleError = (msg: string) => {
      setStatus('error');
      toast.error('❌ Confirmation failed', {
        description: msg,
        duration: 5000
      });
      setTimeout(() => router.replace('/dashboard/settings'), 3000);
    };

    run();
  }, [params, supabase, router]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-3 text-center'>
      {status === 'loading' && (
        <>
          <Loader2 className='text-primary mb-2 h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>Verifying your email…</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle2 className='mb-2 h-10 w-10 text-emerald-500' />
          <p className='font-medium'>Email confirmed!</p>
          <p className='text-muted-foreground text-sm'>Redirecting…</p>
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
