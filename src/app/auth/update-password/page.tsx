'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';

import { useTranslations } from 'next-intl';

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('UpdatePassword');

  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (password !== confirmPassword) {
        toast.error(t('passwordsDontMatch'));
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw new Error('updateFailed');

      toast.success(t('success'));
      router.push('/auth/sign-in');
    } catch (err: any) {
      console.error('❌ Update failed:', err);

      toast.error(t(err.message as any) || t('failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <div className='flex flex-col justify-center px-8 py-12'>
        <div className='mx-auto w-full max-w-sm'>
          <Card>
            <CardHeader>
              <CardTitle className='text-2xl font-bold'>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleUpdate} className='space-y-4'>
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

                <div className='relative'>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder={t('confirmPassword')}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      {t('updating')}
                    </>
                  ) : (
                    t('button')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
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
