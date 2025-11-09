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
    async function confirm() {
      try {
        // 1️⃣ Token aus URL (query oder hash)
        let access_token = params.get('access_token');
        let refresh_token = params.get('refresh_token');

        if (!access_token) {
          const hash = window.location.hash;
          const hashParams = new URLSearchParams(hash.replace('#', ''));
          access_token = hashParams.get('access_token');
          refresh_token = hashParams.get('refresh_token');
        }

        if (!access_token) throw new Error('No access token found in URL');

        // 2️⃣ Session mit Token wiederherstellen
        const { data, error } = await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token ?? ''
        });

        if (error) throw error;

        // 3️⃣ Erfolgsmeldung + Weiterleitung
        setStatus('success');
        toast.success('✅ Email updated successfully', {
          description: 'Redirecting to your account settings...',
          duration: 4000
        });

        setTimeout(
          () => router.replace('/dashboard/settings?email-updated=1'),
          2500
        );
      } catch (err: any) {
        console.error('Email confirmation error:', err);
        setStatus('error');
        toast.error('❌ Confirmation failed', {
          description: err.message || 'Something went wrong.',
          duration: 5000
        });
        setTimeout(() => router.replace('/dashboard/settings'), 3000);
      }
    }

    confirm();
  }, [supabase, router, params]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-3 text-center'>
      {status === 'loading' && (
        <>
          <Loader2 className='text-primary mb-2 h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>
            Confirming your new email address...
          </p>
        </>
      )}

      {status === 'success' && (
        <>
          <CheckCircle2 className='mb-2 h-10 w-10 text-emerald-400' />
          <p className='text-foreground font-medium'>Email confirmed!</p>
          <p className='text-muted-foreground text-sm'>
            Redirecting back to your account settings...
          </p>
        </>
      )}

      {status === 'error' && (
        <>
          <XCircle className='mb-2 h-10 w-10 text-red-500' />
          <p className='text-foreground font-medium'>Something went wrong</p>
          <p className='text-muted-foreground text-sm'>
            You will be redirected to settings shortly.
          </p>
        </>
      )}
    </div>
  );
}
