import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server'; // dein server client (liest cookies/session)

/**
 * Löscht den aktuell eingeloggten Benutzer aus Supabase Auth
 * – verhindert Selbstlöschung von Admins
 */
export async function POST() {
  try {
    // ✅ 1️⃣ Server-Client mit Session
    const supabase = createServerClient();

    // ✅ 2️⃣ Aktuellen User holen
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ 3️⃣ Schutz: Admins dürfen sich selbst nicht löschen
    if (user.user_metadata?.role === 'admin') {
      return NextResponse.json(
        { error: 'Admins cannot delete themselves.' },
        { status: 403 }
      );
    }

    // ✅ 4️⃣ Admin-Service-Client (mit Service Role Key)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // nur serverseitig erlaubt!
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ✅ 5️⃣ Benutzer endgültig löschen
    const { error: delError } = await admin.auth.admin.deleteUser(user.id);

    if (delError) {
      console.error('❌ Delete user failed:', delError.message);
      return NextResponse.json({ error: delError.message }, { status: 500 });
    }

    // ✅ 6️⃣ Erfolgsmeldung
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ POST /api/delete-user error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
