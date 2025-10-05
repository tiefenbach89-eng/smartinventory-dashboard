'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function SignInPage() {
  const supabase = createClient();
  const router = useRouter();
  const search = useSearchParams();
  const redirectTo = search.get('redirectedFrom') || '/dashboard/overview';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.push(redirectTo);
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else alert('Check your email for confirmation link');
  }

  return (
    <div className="flex min-h-[90vh] items-center justify-center p-4">
      <Card className="w-full max-w-md border shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-semibold">
            Welcome back 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-500 text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <div className="my-4 flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <Button
            variant="outline"
            className="w-full mb-2"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
          >
            Sign in with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'github' })}
          >
            Sign in with GitHub
          </Button>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">
              Don’t have an account?{' '}
            </span>
            <Button
              type="button"
              variant="link"
              className="p-0"
              onClick={handleSignUp}
            >
              Sign up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

