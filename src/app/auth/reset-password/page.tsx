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

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`
      });
      if (error) throw error;
      toast.success('Password reset link sent. Please check your inbox.');
      router.push('/auth/sign-in');
    } catch (err: any) {
      console.error('❌ Password reset failed:', err);
      toast.error(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='grid min-h-screen lg:grid-cols-2'>
      <div className='flex flex-col justify-center px-8 py-12'>
        <div className='mx-auto w-full max-w-sm'>
          <CardModern className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/25 over:translate-y-0 animate-gradient-move w-full max-w-md border bg-gradient-to-b p-8 shadow-sm backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_25px_var(--tw-shadow-color)]'>
            <CardHeader>
              <CardTitle className='text-2xl font-semibold'>
                Reset Password
              </CardTitle>
              <CardDescription className='text-muted-foreground mt-1 text-sm'>
                Enter your email address to receive a reset link.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleReset} className='space-y-4'>
                <Input
                  type='email'
                  placeholder='Email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Button type='submit' className='w-full' disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Sending link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>

              <div className='text-muted-foreground mt-4 text-center text-sm'>
                <p>
                  Remembered your password?{' '}
                  <Link href='/auth/sign-in' className='text-primary underline'>
                    Back to Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </CardModern>
        </div>
      </div>

      <div className='bg-muted hidden lg:flex lg:flex-col lg:items-center lg:justify-center'>
        <blockquote className='max-w-md space-y-2 text-center'>
          <p className='text-lg leading-relaxed font-medium'>
            “Your SmartInventory account security is our top priority.”
          </p>
          <footer className='text-muted-foreground text-sm'>
            — SmartInventory
          </footer>
        </blockquote>
      </div>
    </div>
  );
}
