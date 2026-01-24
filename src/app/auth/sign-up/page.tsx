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

export default function SignUpPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('SignUp');

  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [form, setForm] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { first_name, last_name, email, password, confirmPassword } = form;

      if (
        !first_name ||
        !last_name ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        toast.error(t('fillAllFields'));
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        toast.error(t('passwordsDontMatch'));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { first_name, last_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw new Error('signupFailed');
      const userId = data.user?.id;

      if (!userId) throw new Error('registrationFailed');

      const res = await fetch('/api/auth/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, first_name, last_name })
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error('roleEntryFailed');

      toast.success(t('verifyEmail'));
      router.push('/auth/sign-in');
    } catch (err: any) {
      console.error('❌ Sign-up failed:', err);

      toast.error(t(err.message as any) || t('signupFailed'));
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
              <form onSubmit={handleSignUp} className='space-y-4'>
                <div className='grid grid-cols-2 gap-3'>
                  <Input
                    placeholder={t('firstName')}
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    required
                  />
                  <Input
                    placeholder={t('lastName')}
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    required
                  />
                </div>

                <Input
                  type='email'
                  placeholder={t('email')}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />

                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('password')}
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
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

                <div className='relative'>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('confirmPassword')}
                    value={form.confirmPassword}
                    onChange={(e) =>
                      setForm({ ...form, confirmPassword: e.target.value })
                    }
                    required
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2'
                  >
                    {showConfirmPassword ? (
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
                      {t('creating')}
                    </>
                  ) : (
                    t('button')
                  )}
                </Button>
              </form>

              {/* ⛔️ LANGUAGE SWITCH BLOCK — ENTFERNT */}

              <p className='text-muted-foreground mt-6 text-center text-sm'>
                {t('alreadyAccount')}{' '}
                <Link href='/auth/sign-in' className='text-primary underline'>
                  {t('signIn')}
                </Link>
              </p>
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
