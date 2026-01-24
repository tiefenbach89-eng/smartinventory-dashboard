'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';

export default function ProfileViewPage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null));
  }, [supabase]);

  if (!user) return null;

  return (
    <div className="flex w-full justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div><strong>Email:</strong> {user.email}</div>
          <div><strong>Name:</strong> {user.user_metadata?.full_name ?? user.user_metadata?.name ?? '—'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
