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
    <div className='grid min-h-screen lg:grid-cols-2'>
      {/* ---------------- LEFT SIDE ---------------- */}
      <div className='flex flex-col justify-center px-8 py-12'>
        <div className='mx-auto w-full max-w-sm'>
          <CardModern className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/25 animate-gradient-move w-full max-w-md border bg-gradient-to-b p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_25px_var(--tw-shadow-color)]'>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold'>
                {t('title')}
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-1 text-sm'>
                {t('email')} / {t('password')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSignIn} className='space-y-4'>
                <Input
                  type='email'
                  placeholder={t('email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2'
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>

                <Button type='submit' className='w-full' disabled={loading}>
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
              <div className='text-muted-foreground mt-4 space-y-1 text-center text-sm'>
                <p>
                  {t('noAccount')}{' '}
                  <Link href='/auth/sign-up' className='text-primary underline'>
                    {t('signUp')}
                  </Link>
                </p>
                <p>
                  <Link
                    href='/auth/reset-password'
                    className='text-primary underline'
                  >
                    {t('forgot')}
                  </Link>
                </p>
              </div>
            </CardContent>
          </CardModern>

          {/* ----------- NEW: LANGUAGE SWITCH under frame ----------- */}
          <div className='mt-6 flex justify-center'>
            <LanguageSwitch />
          </div>
        </div>
      </div>

      {/* ---------------- RIGHT SIDE ---------------- */}
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
