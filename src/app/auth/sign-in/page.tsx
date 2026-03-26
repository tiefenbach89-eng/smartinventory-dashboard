'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
        if (msg.includes('email not confirmed')) return toast.info(t('emailNotConfirmed'));
        if (msg.includes('invalid login credentials')) return toast.error(t('invalidCredentials'));
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
    <div className='relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-10 sm:px-8'>

      {/* ── Background with ambient glow ── */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-background' />
      <div className='pointer-events-none fixed inset-0 -z-10'>
        <div className='absolute top-1/4 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[80px] dark:bg-primary/12' />
        <div className='absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/5 blur-[60px] dark:bg-primary/8' />
      </div>

      {/* ── Language Switcher ── */}
      <div className='fixed top-5 right-5 z-10'>
        <LanguageSwitch />
      </div>

      {/* ── Login Card ── */}
      <div className='animate-scale-in w-full max-w-[400px]'>

        {/* Brand */}
        <div className='mb-8 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-xl shadow-primary/25'>
            <svg viewBox='0 0 24 24' fill='none' className='h-8 w-8 text-primary-foreground' stroke='currentColor' strokeWidth='2'>
              <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
              <polyline points='9 22 9 12 15 12 15 22' />
            </svg>
          </div>
          <h1 className='text-2xl font-black tracking-tight sm:text-3xl'>
            <span className='bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent'>Smart</span>
            <span className='bg-gradient-to-br from-primary to-primary/80 bg-clip-text text-transparent'>Inventory</span>
          </h1>
          <p className='text-muted-foreground mt-1.5 text-sm'>
            {t('title')}
          </p>
        </div>

        {/* Form Card */}
        <div className='rounded-2xl border border-border/60 bg-card/90 p-6 shadow-xl backdrop-blur-sm dark:border-border/40 dark:bg-card/80 sm:p-8'>
          {/* Inset top highlight */}
          <div className='absolute inset-x-0 top-0 h-px rounded-t-2xl bg-gradient-to-r from-transparent via-primary/30 to-transparent' />

          <form onSubmit={handleSignIn} className='space-y-5'>

            {/* Email */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {t('email')}
              </label>
              <Input
                type='email'
                placeholder='name@firma.de'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='h-11 rounded-xl border-border/60 bg-background/60 text-sm backdrop-blur-sm transition-colors focus:border-primary/60 focus:ring-primary/15'
                autoComplete='email'
                autoCapitalize='none'
              />
            </div>

            {/* Password */}
            <div className='space-y-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                {t('password')}
              </label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='h-11 rounded-xl border-border/60 bg-background/60 pr-12 text-sm backdrop-blur-sm transition-colors focus:border-primary/60 focus:ring-primary/15'
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute top-1/2 right-0 flex h-11 w-11 -translate-y-1/2 items-center justify-center text-muted-foreground transition-colors hover:text-foreground active:opacity-60'
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className='flex justify-end'>
              <Link
                href='/auth/reset-password'
                className='text-xs font-semibold text-primary underline-offset-2 hover:underline'
              >
                {t('forgot')}
              </Link>
            </div>

            {/* Submit */}
            <Button
              type='submit'
              className='h-11 w-full rounded-xl bg-primary text-sm font-bold shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-[0.98]'
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

          {/* Sign up link */}
          <p className='mt-5 text-center text-sm text-muted-foreground'>
            {t('noAccount')}{' '}
            <Link
              href='/auth/sign-up'
              className='font-semibold text-primary underline-offset-2 hover:underline'
            >
              {t('signUp')}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className='mt-6 text-center text-[11px] text-muted-foreground/40'>
          Smart Inventory 2026 · Programmed by Alexander T.
        </p>
      </div>
    </div>
  );
}
