import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log(
      '🟢 [API] Fetching artikel_log entries (with lieferscheinnr)...'
    );

    const { data, error } = await supabase
      .from('artikel_log')
      .select(
        'timestamp, benutzer, artikelname, menge_diff, kommentar, lieferscheinnr'
      ) // 🆕 hinzugefügt
      .order('timestamp', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('❌ Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Returned ${data?.length || 0} artikel_log entries`);
    return NextResponse.json({ data });
  } catch (err: any) {
    console.error('❌ [API] Failed to fetch activity:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
