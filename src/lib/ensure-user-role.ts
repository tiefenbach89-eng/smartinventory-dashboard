import { createClient } from '@/lib/supabase/client';
import type { Role } from '@/lib/permissions';

/**
 * ensureUserRoleRow
 * Prüft, ob ein Eintrag in user_roles für diesen User existiert,
 * und legt ihn automatisch an, falls nicht.
 */
export async function ensureUserRoleRow(userId: string) {
  const supabase = createClient();

  // Prüfen, ob der User schon in user_roles existiert
  const { data, error } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Failed to check user_roles:', error);
    return;
  }

  // Wenn kein Eintrag existiert → neu anlegen
  if (!data) {
    const { error: insertError } = await supabase.from('user_roles').insert([
      {
        user_id: userId,
        // Default-Rolle für neue User
        role: 'employee' as Role,
        // Standard: noch nicht freigeschaltet, Admin muss freigeben
        approved: false,
        // Neue Accounts sind nicht automatisch gesperrt
        banned: false
      }
    ]);

    if (insertError) {
      console.error('❌ Failed to insert user_roles entry:', insertError);
    } else {
      console.log(`✅ user_roles entry created for ${userId}`);
    }
  }
}
