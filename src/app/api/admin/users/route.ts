import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// 🟢 GET: list all users with merged roles and names
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const { data: authData, error: authError } =
      await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const authUsers = authData.users;

    const { data: rolesData, error: roleError } = await supabase
      .from('user_roles')
      .select('*');
    if (roleError) throw roleError;

    const merged = authUsers.map((u) => {
      const r = rolesData.find((row) => row.user_id === u.id);

      return {
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        role: r?.role ?? 'employee',
        approved: r?.approved ?? false,
        banned: r?.banned ?? false,
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

    // 🔹 Authentifizierten User auslesen
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) throw new Error('Invalid user session');

    // 🔹 Rolle des aktuellen Users aus user_roles laden
    const { data: currentRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (currentRole?.role !== 'admin') {
      throw new Error('Only admins can change user roles.');
    }

    // 🔹 Restlicher Update-Code bleibt gleich
    const { data: existing } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    const merged = {
      user_id,
      role: role ?? existing?.role ?? 'employee',
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

// ---------------------------------------------------------------------------
// 🔵 POST: create new user manually (Admin-only)
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, first_name, last_name, role } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin permission
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user: adminUser },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !adminUser) throw new Error('Invalid user session');

    // Check if requester is admin
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', adminUser.id)
      .single();

    if (adminRole?.role !== 'admin') {
      throw new Error('Only admins can create users.');
    }

    // Create user with Supabase Admin API
    const { data: newUser, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name,
          last_name
        }
      });

    if (createError) throw createError;
    if (!newUser.user) throw new Error('Failed to create user');

    // Create user_roles entry (use upsert to avoid duplicate key constraint errors)
    const { error: roleError } = await supabase.from('user_roles').upsert({
      user_id: newUser.user.id,
      role: role || 'employee',
      approved: true, // Auto-approve manually created users
      banned: false,
      first_name,
      last_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id' // Use user_id as conflict resolution key
    });

    if (roleError) throw roleError;

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email
      }
    });
  } catch (err: any) {
    console.error('❌ POST /api/admin/users:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// 🔴 DELETE: remove user completely (Admin-only recommended)
// ---------------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id)
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });

    const { error: deleteAuthErr } =
      await supabase.auth.admin.deleteUser(user_id);
    if (deleteAuthErr) throw deleteAuthErr;

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
