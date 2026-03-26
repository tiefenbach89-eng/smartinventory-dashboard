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

      {/* ── Background ── */}
      <div className='pointer-events-none fixed inset-0 -z-10 bg-background' />

      {/* ── Language Switcher — top right ── */}
      <div className='fixed top-5 right-5 z-10'>
        <LanguageSwitch />
      </div>

      {/* ── Login Card ── */}
      <div className='animate-scale-in w-full max-w-[400px]'>

        {/* Logo / Brand mark */}
        <div className='mb-8 text-center'>
          <div className='mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-md'>
            <svg viewBox='0 0 24 24' fill='none' className='h-7 w-7 text-primary-foreground' stroke='currentColor' strokeWidth='2.2'>
              <path d='M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' />
              <polyline points='9 22 9 12 15 12 15 22' />
            </svg>
          </div>
          <h1 className='text-2xl font-bold tracking-tight sm:text-3xl'>
            SmartInventory
          </h1>
          <p className='text-muted-foreground mt-1 text-sm'>
            {t('title')}
          </p>
        </div>

        {/* Form Card */}
        <div className='rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8'>
          <form onSubmit={handleSignIn} className='space-y-4'>

            {/* Email */}
            <div className='space-y-1.5'>
              <label className='text-foreground/80 text-xs font-semibold uppercase tracking-wider'>
                {t('email')}
              </label>
              <Input
                type='email'
                placeholder='name@firma.de'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='h-12 rounded-xl border-border/60 bg-background/60 text-base backdrop-blur-sm focus:border-primary focus:ring-primary/20'
                autoComplete='email'
                autoCapitalize='none'
              />
            </div>

            {/* Password */}
            <div className='space-y-1.5'>
              <label className='text-foreground/80 text-xs font-semibold uppercase tracking-wider'>
                {t('password')}
              </label>
              <div className='relative'>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='••••••••'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='h-12 rounded-xl border-border/60 bg-background/60 pr-12 text-base backdrop-blur-sm focus:border-primary focus:ring-primary/20'
                  autoComplete='current-password'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='text-muted-foreground absolute top-1/2 right-0 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-r-xl active:opacity-60'
                  aria-label={showPassword ? 'Passwort verbergen' : 'Passwort anzeigen'}
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div className='flex justify-end'>
              <Link
                href='/auth/reset-password'
                className='text-primary text-xs font-semibold underline-offset-2 hover:underline'
              >
                {t('forgot')}
              </Link>
            </div>

            {/* Submit */}
            <Button
              type='submit'
              className='mt-1 h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground active:scale-[0.98]'
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
          <p className='text-muted-foreground mt-5 text-center text-sm'>
            {t('noAccount')}{' '}
            <Link
              href='/auth/sign-up'
              className='text-primary font-semibold underline-offset-2 hover:underline'
            >
              {t('signUp')}
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className='text-muted-foreground/50 mt-6 text-center text-[11px]'>
          Smart Inventory 2026 · Programmed by Alexander T.
        </p>
      </div>
    </div>
  );
}
