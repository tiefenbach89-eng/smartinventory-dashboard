'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleSession = async () => {
      // 🔹 Versuche, Session abzufangen (nach Email-Bestätigung)
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('❌ Supabase session error:', error);
        toast.error('Something went wrong verifying your email.');
        router.push('/auth/sign-in');
        return;
      }

      const session = data?.session;
      if (session?.user) {
        toast.success('Your email has been verified successfully!');
        router.push('/auth/sign-in');
      } else {
        router.push('/auth/sign-in');
      }
    };

    handleSession();
  }, [router, supabase]);

  return (
    <div className='flex h-screen flex-col items-center justify-center text-center'>
      <Loader2 className='text-muted-foreground mb-4 h-6 w-6 animate-spin' />
      <p className='text-muted-foreground text-sm'>Verifying your account...</p>
    </div>
  );
}
