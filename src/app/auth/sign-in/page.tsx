'use client';

import * as React from 'react';
import Link from 'next/link';
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

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
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
          return toast.info('Please verify your email before logging in.');
        if (msg.includes('invalid login credentials'))
          return toast.error('Invalid email or password.');
        throw error;
      }

      const user = data.user;
      if (!user?.email_confirmed_at) {
        toast.info('Please verify your email before logging in.');
        await supabase.auth.signOut();
        return;
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('approved, banned')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleData?.banned) {
        toast.error('Your account has been banned.');
        await supabase.auth.signOut();
        return;
      }
      if (!roleData?.approved) {
        toast.info('Your account is pending admin approval.');
        await supabase.auth.signOut();
        return;
      }

      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Sign-in failed:', err);
      toast.error(err.message || 'Login failed.');
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
              <CardTitle className='text-2xl font-bold'>Sign in</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className='space-y-4'>
                <Input
                  type='email'
                  placeholder='Email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <div className='relative'>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Password'
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
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' /> Signing
                      in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </form>

              <div className='text-muted-foreground mt-4 space-y-1 text-center text-sm'>
                <p>
                  Don’t have an account?{' '}
                  <Link href='/auth/sign-up' className='text-primary underline'>
                    Sign up
                  </Link>
                </p>
                <p>
                  Forgot your password?{' '}
                  <Link
                    href='/auth/reset-password'
                    className='text-primary underline'
                  >
                    Reset it
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='bg-muted hidden lg:flex lg:flex-col lg:items-center lg:justify-center'>
        <blockquote className='max-w-md space-y-2 text-center'>
          <p className='text-lg leading-relaxed font-medium'>
            “SmartInventory keeps our warehouse data accurate and organized.”
          </p>
          <footer className='text-muted-foreground text-sm'>
            — Alexander Tiefenbach
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
