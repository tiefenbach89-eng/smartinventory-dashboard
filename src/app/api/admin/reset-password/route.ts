import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user_id, new_password } = body;

    if (!user_id || !new_password) {
      return NextResponse.json(
        { error: 'Missing user_id or new_password' },
        { status: 400 }
      );
    }

    if (new_password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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
      throw new Error('Only admins can reset passwords.');
    }

    // Update user password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user_id,
      { password: new_password }
    );

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ POST /api/admin/reset-password:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
