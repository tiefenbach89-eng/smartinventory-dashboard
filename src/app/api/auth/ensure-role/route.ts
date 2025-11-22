import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1) Aktuelle Session holen
    const {
      data: { user },
      error: sessionError
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json({ error: 'No user session' }, { status: 401 });
    }

    const userId = user.id;

    // 2) Prüfen, ob user_roles existiert
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError && roleError.code !== 'PGRST116') {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    // 3) Existiert Rolle bereits?
    if (role) {
      return NextResponse.json({ status: 'exists', role }, { status: 200 });
    }

    // 4) Automatisch neuen Eintrag erzeugen
    const { error: insertError } = await supabase.from('user_roles').insert({
      user_id: userId,
      role: 'employee',
      approved: false,
      banned: false
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ status: 'created', role: 'employee' });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
