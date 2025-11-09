'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';

export default function ConfirmEmailPage() {
  const supabase = createClient();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    async function confirm() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;

        setStatus('success');
        toast.success('✅ Email updated successfully', {
          description:
            'You will be redirected to your account settings shortly.',
          duration: 4000
        });

        setTimeout(() => router.replace('/settings'), 2500);
      } catch (err: any) {
        setStatus('error');
        toast.error('❌ Confirmation failed', {
          description: err.message || 'Something went wrong.',
          duration: 5000
        });

        setTimeout(() => router.replace('/settings'), 3000);
      }
    }
    confirm();
  }, [supabase, router]);

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
