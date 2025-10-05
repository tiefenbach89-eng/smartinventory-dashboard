import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  // 👇 "await" ist wichtig, weil createClient async ist
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/auth/sign-in');
  redirect('/dashboard/overview');
}
