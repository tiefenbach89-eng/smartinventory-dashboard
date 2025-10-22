import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 🟢 GET: list all users with merged roles and names
export async function GET() {
  try {
    // 1️⃣ Auth-Users laden
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers();
    if (authError) throw authError;
    const authUsers = authData.users;

    // 2️⃣ user_roles laden
    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('*');
    if (roleError) throw roleError;

    // 3️⃣ Mergen
    const merged = authUsers.map((u) => {
      const r = rolesData.find((row) => row.user_id === u.id);

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,

        // 🧩 user_roles Daten
        role: r?.role ?? 'viewer',
        approved: r?.approved ?? false,
        banned: r?.banned ?? false,

        // 🧠 user_metadata aus Supabase Auth oder user_roles fallback
        user_metadata: {
          first_name: u.user_metadata?.first_name ?? r?.first_name ?? '',
          last_name: u.user_metadata?.last_name ?? r?.last_name ?? '',
          display_name:
            `${u.user_metadata?.first_name ?? r?.first_name ?? ''} ${
              u.user_metadata?.last_name ?? r?.last_name ?? ''
            }`.trim()
        }
      };
    });

    return NextResponse.json({ users: merged });
  } catch (err: any) {
    console.error('❌ GET /api/admin/users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🟠 PATCH: update or insert user_roles entry
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { user_id, role, banned, approved } = body;
    if (!user_id) throw new Error('Missing user_id');

    // check existing role entry
    const { data: existing, error: selectErr } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();
    if (selectErr) throw selectErr;

    const merged = {
      user_id,
      role: role ?? existing?.role ?? 'viewer',
      banned: banned ?? existing?.banned ?? false,
      approved: approved ?? existing?.approved ?? false,
      updated_at: new Date().toISOString()
    };

    const { error: upsertErr } = await supabase
      .from('user_roles')
      .upsert(merged, { onConflict: 'user_id' });
    if (upsertErr) throw upsertErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ PATCH /api/admin/users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// 🔴 DELETE: remove user completely
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id)
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

    // 1️⃣ Delete from Supabase Auth
    const { error: deleteAuthErr } =
      await supabase.auth.admin.deleteUser(user_id);
    if (deleteAuthErr) throw deleteAuthErr;

    // 2️⃣ Delete from user_roles
    const { error: deleteRoleErr } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', user_id);
    if (deleteRoleErr) throw deleteRoleErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ DELETE /api/admin/users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
