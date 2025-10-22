import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // letzte 30 Tage
    const { data, error } = await supabase
      .from('artikel_log')
      .select('timestamp, benutzer, artikelname, menge_diff, kommentar')
      .gte(
        'timestamp',
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order('timestamp', { ascending: false })
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('❌ /api/activity failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
