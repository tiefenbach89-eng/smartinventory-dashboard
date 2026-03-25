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
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { useTranslations } from 'next-intl';
import LanguageSwitch from '@/components/language-switch';

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('Login');

  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        const msg = error.message?.toLowerCase?.() || '';

        if (msg.includes('email not confirmed'))
          return toast.info(t('emailNotConfirmed'));

        if (msg.includes('invalid login credentials'))
          return toast.error(t('invalidCredentials'));

        return toast.error(t('loginFailed'));
      }

      const user = data.user;
      if (!user?.email_confirmed_at) {
        toast.info(t('emailNotConfirmed'));
        await supabase.auth.signOut();
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('approved, banned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData?.banned) {
        toast.error(t('banned'));
        await supabase.auth.signOut();
        return;
      }

      if (!roleData?.approved) {
        toast.info(t('pendingApproval'));
        await supabase.auth.signOut();
        return;
      }

      toast.success(t('welcomeBack'));
      router.push('/dashboard');
    } catch {
      toast.error(t('loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid min-h-[100dvh] lg:grid-cols-2'>
      {/* ---------------- LEFT SIDE ---------------- */}
      <div className='flex flex-col items-center justify-center px-5 py-safe pt-8 pb-8 sm:px-8 sm:py-12'>
        <div className='w-full max-w-sm'>
          <CardModern className='border-border/40 from-card/90 via-card/70 to-background/40 w-full border bg-gradient-to-b p-6 shadow-lg backdrop-blur-md sm:p-8'>
            <CardHeader className='px-0 pt-0'>
              <CardTitle className='text-2xl font-bold sm:text-3xl'>
                {t('title')}
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-1 text-sm'>
                {t('email')} / {t('password')}
              </CardDescription>
            </CardHeader>

            <CardContent className='px-0 pb-0'>
              <form onSubmit={handleSignIn} className='space-y-3'>
                <Input
                  type='email'
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='h-12 rounded-xl text-base'
                  autoComplete='email'
                  autoCapitalize='none'
                />

                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className='h-12 rounded-xl pr-12 text-base'
                    autoComplete='current-password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='text-muted-foreground absolute top-1/2 right-0 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-r-xl'
                    aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                <Button
                  type='submit'
                  className='h-12 w-full rounded-xl text-base font-semibold active:scale-[0.98]'
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t('button')}
                    </>
                  ) : (
                    t('button')
                  )}
                </Button>
              </form>

              {/* Links */}
              <div className='text-muted-foreground mt-5 space-y-2 text-center text-sm'>
                <p>
                  {t('noAccount')}{' '}
                  <Link href='/auth/sign-up' className='text-primary font-medium underline underline-offset-2'>
                    {t('signUp')}
                  </Link>
                </p>
                <p>
                  <Link
                    href='/auth/reset-password'
                    className='text-primary font-medium underline underline-offset-2'
                  >
                    {t('forgot')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </CardModern>

          {/* Language Switch */}
          <div className='mt-5 flex justify-center'>
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE (desktop only) ---------------- */}
      <div className='bg-muted/50 hidden lg:flex lg:flex-col lg:items-center lg:justify-center'>
        <blockquote className='max-w-md space-y-3 px-8 text-center'>
          <p className='text-xl leading-relaxed font-medium'>{t('quote')}</p>
          <footer className='text-muted-foreground text-sm font-medium'>
            {t('brand')}
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
