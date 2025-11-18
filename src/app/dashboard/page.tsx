// src/app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Benutzer existiert → weiter zur Übersicht
  redirect('/dashboard/overview');
}
