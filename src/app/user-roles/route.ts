import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from('user_roles').select('*');
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ roles: data });
}

export async function PATCH(req: Request) {
  const supabase = createClient();
  const body = await req.json();
  const { user_id, role } = body;

  if (!user_id || !role)
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

  const { error } = await supabase
    .from('user_roles')
    .update({ role })
    .eq('user_id', user_id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
