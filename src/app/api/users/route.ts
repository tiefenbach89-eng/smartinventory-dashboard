import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  console.log('🔍 API /api/users hit');

  // --- ENV DEBUG ---
  console.log('🔑 URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log(
    '🔑 SERVICE ROLE KEY present:',
    !!process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // --- Supabase client with Service Role ---
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('📡 Calling listUsers...');
    const { data, error } = await supabase.auth.admin.listUsers();
    console.log('📥 Result:', { data: !!data, error });

    if (error) throw error;

    // Optional: Rollen nachladen
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role');

    if (roleError) console.warn('⚠️ Role fetch error:', roleError.message);

    const usersWithRoles = data.users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      role: roles?.find((r) => r.user_id === u.id)?.role ?? 'user'
    }));

    console.log('✅ Returning usersWithRoles:', usersWithRoles.length);

    return NextResponse.json({ users: usersWithRoles });
  } catch (err: any) {
    console.error('❌ API ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
