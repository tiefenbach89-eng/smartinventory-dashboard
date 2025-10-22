import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/stock-log
 * Creates a new stock log entry and updates inventory safely (Service Role)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      artikelnummer,
      artikelname,
      alt_wert,
      neu_wert,
      menge_diff,
      preis_snapshot,
      aktion,
      kommentar,
      lieferant,
      benutzer,
      lieferscheinnr
    } = body;

    // 🧩 Format user name + email
    let benutzer_name = benutzer;
    if (typeof benutzer === 'object' && benutzer.user_metadata) {
      const first = benutzer.user_metadata.first_name ?? '';
      const last = benutzer.user_metadata.last_name ?? '';
      const email = benutzer.email ?? '';
      benutzer_name = `${first} ${last}`.trim() + (email ? ` (${email})` : '');
    }

    // 1️⃣ Update product stock
    const { error: updateErr } = await supabase
      .from('artikel')
      .update({ bestand: neu_wert, preis: preis_snapshot })
      .eq('artikelnummer', Number(artikelnummer));
    if (updateErr) throw updateErr;

    // 2️⃣ Insert log entry
    const { error: insertErr } = await supabase.from('artikel_log').insert([
      {
        timestamp: new Date().toISOString(),
        artikelnummer,
        artikelname,
        alt_wert,
        neu_wert,
        menge_diff,
        preis_snapshot,
        aktion,
        kommentar,
        lieferant,
        benutzer: benutzer_name,
        lieferscheinnr: lieferscheinnr || null
      }
    ]);
    if (insertErr) throw insertErr;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('❌ /api/stock-log failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
