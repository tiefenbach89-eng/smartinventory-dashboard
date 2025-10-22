import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { user_id, first_name, last_name } = await req.json();
    if (!user_id) throw new Error('Missing user_id');

    // 🧩 Prüfen, ob Benutzer bereits existiert (Trigger erstellt user_roles automatisch)
    const { data: existingUser, error: userError } =
      await supabase.auth.admin.getUserById(user_id);

    if (userError) {
      console.warn(
        '⚠️ Benutzer noch nicht vollständig registriert:',
        userError.message
      );
      return NextResponse.json({
        success: false,
        message:
          'User not yet available in auth.users. The trigger will handle this automatically after email verification.'
      });
    }

    // 🧩 Zusätzliche optionale Daten (Display-Name speichern)
    await supabase
      .from('user_roles')
      .update({
        first_name,
        last_name,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id);

    // ✅ Erfolg
    return NextResponse.json({
      success: true,
      message: 'User entry handled via trigger or updated successfully.'
    });
  } catch (err: any) {
    console.error('❌ /api/auth/create-user failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
