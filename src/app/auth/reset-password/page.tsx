'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { CardModern } from '@/components/ui/card-modern';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { useTranslations } from 'next-intl';

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('ResetPassword');

  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      });

      if (error) throw new Error('errorReset');

      toast.success(t('success'));
      router.push('/auth/sign-in');
    } catch (err: any) {
      console.error('❌ Password reset failed:', err);
      toast.error(t('failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <div className='flex flex-col justify-center px-8 py-12'>
        <div className='mx-auto w-full max-w-sm'>
          <CardModern className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/25 animate-gradient-move w-full max-w-md border bg-gradient-to-b p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_25px_var(--tw-shadow-color)]'>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold'>
                {t('title')}
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-1 text-sm'>
                {t('description')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleReset} className='space-y-4'>
                <Input
                  type='email'
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type='submit' className='w-full' disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('sending')}
                    </>
                  ) : (
                    t('button')
                  )}
                </Button>
              </form>

              <div className='text-muted-foreground mt-4 text-center text-sm'>
                <p>
                  {t('remembered')}{' '}
                  <Link href='/auth/sign-in' className='text-primary underline'>
                    {t('back')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </CardModern>
        </div>
      </div>

      <div className='bg-muted hidden lg:flex lg:flex-col lg:items-center lg:justify-center'>
        <blockquote className='max-w-md space-y-2 text-center'>
          <p className='text-lg leading-relaxed font-medium'>{t('quote')}</p>
          <footer className='text-muted-foreground text-sm'>
            {t('brand')}
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
