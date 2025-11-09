'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfirmEmailPage() {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [message, setMessage] = useState<string>(
    'Confirming your new email address...'
  );

  useEffect(() => {
    async function confirmEmail() {
      try {
        // ✅ Supabase tauscht hier den Code aus der URL gegen eine Session aus
        const { error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );

        if (error) throw error;

        setStatus('success');
        setMessage('Email confirmed! Redirecting to account settings...');

        toast.success('✅ Email updated successfully', {
          description:
            'You will be redirected to your account settings shortly.',
          duration: 4000
        });

        // ✅ Redirect in den richtigen Pfad deiner App
        setTimeout(
          () => router.replace('/dashboard/settings?email-updated=1'),
          2500
        );
      } catch (err: any) {
        console.error('Email confirmation error:', err);
        setStatus('error');
        setMessage(
          err.message || 'Something went wrong during email confirmation.'
        );

        toast.error('❌ Confirmation failed', {
          description: err.message || 'Something went wrong.',
          duration: 5000
        });

        setTimeout(
          () => router.replace('/dashboard/settings?email-updated=0'),
          3000
        );
      }
    }

    confirmEmail();
  }, [supabase, router]);

  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-3 text-center'>
      {status === 'loading' && (
        <>
          <Loader2 className='text-primary mb-2 h-8 w-8 animate-spin' />
          <p className='text-muted-foreground text-sm'>{message}</p>
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
