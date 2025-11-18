'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const t = useTranslations('Callback');

  useEffect(() => {
    const handleSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Supabase session error:', error);
        toast.error(t('verifyFailed'));
        router.push('/auth/sign-in');
        return;
      }

      const session = data?.session;

      if (session?.user) {
        toast.success(t('verifySuccess'));
      }

      router.push('/auth/sign-in');
    };

    handleSession();
  }, [router, supabase, t]);

  return (
    <div className='flex h-screen flex-col items-center justify-center text-center'>
      <Loader2 className='text-muted-foreground mb-4 h-6 w-6 animate-spin' />
      <p className='text-muted-foreground text-sm'>{t('verifying')}</p>
    </div>
  );
}
