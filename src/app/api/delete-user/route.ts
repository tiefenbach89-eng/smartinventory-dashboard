import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server'; // dein server client (session aus cookies)

export async function POST() {
  try {
    const supabase = createServerClient(); // liest aktuelle Session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional: Admin-Schutz – Admins dürfen sich NICHT löschen
    // Wenn du ein Admin-Flag hast, z.B. user.user_metadata.role === 'admin'
    if (user.user_metadata?.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot delete themselves.' },
        { status: 403 }
      );
    }

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Server-only!
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: delError } = await admin.auth.admin.deleteUser(user.id);
    if (delError) {
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Server error' },
      { status: 500 }
    );
  }
}
