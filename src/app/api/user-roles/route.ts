import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🧱 Server-Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 📡 GET: Alle Rollen abrufen
export async function GET() {
  try {
    const { data, error } = await supabase.from('user_roles').select('*');
    if (error) throw error;
    return NextResponse.json({ roles: data });
  } catch (err: any) {
    console.error('❌ Error loading roles:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ✏️ PATCH: Rolle eines Benutzers ändern
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { user_id, role } = body;

    if (!user_id || !role)
      return NextResponse.json(
        { error: 'Missing user_id or role' },
        { status: 400 }
      );

    const { error } = await supabase
      .from('user_roles')
      .update({ role })
      .eq('user_id', user_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ Error updating role:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
