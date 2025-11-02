'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// ---------------------------------------------------------------------------
// 🔸 TYPE DEFINITIONS
// ---------------------------------------------------------------------------
export type RolePermissions = {
  role: string;
  can_access_admin_panel: boolean;
  can_manage_users: boolean;
  can_delete_users: boolean;
  can_manage_products: boolean;
  can_adjust_stock: boolean;
  can_delete_products: boolean;

  // 🆕 Neue Felder für ProductPage
  can_list_products?: boolean;
  can_add_stock?: boolean;
  can_remove_stock?: boolean;
  can_edit_products?: boolean;
};

// ---------------------------------------------------------------------------
// 🔹 CUSTOM HOOK – useRolePermissions()
// ---------------------------------------------------------------------------
export function useRolePermissions() {
  const supabase = createClient();
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      try {
        // 1️⃣ Aktuellen User abrufen
        const {
          data: { user },
          error: userError
        } = await supabase.auth.getUser();

        if (userError || !user) {
          console.warn('No user logged in.');
          setPermissions(null);
          setLoading(false);
          return;
        }

        // 2️⃣ Rolle aus user_roles holen
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (roleError || !userRole?.role) {
          console.warn('No role found for user.');
          setPermissions(null);
          setLoading(false);
          return;
        }

        // 3️⃣ Berechtigungen für diese Rolle aus role_permissions holen
        const { data: perms, error: permsError } = await supabase
          .from('role_permissions')
          .select('*')
          .eq('role', userRole.role)
          .single();

        if (permsError) throw permsError;

        // 4️⃣ Optional: Fehlende Felder mit Default false füllen
        const safePerms: RolePermissions = {
          role: userRole.role,
          can_access_admin_panel: perms?.can_access_admin_panel ?? false,
          can_manage_users: perms?.can_manage_users ?? false,
          can_delete_users: perms?.can_delete_users ?? false,
          can_manage_products: perms?.can_manage_products ?? false,
          can_adjust_stock: perms?.can_adjust_stock ?? false,
          can_delete_products: perms?.can_delete_products ?? false,

          // Neue Felder (optional)
          can_list_products: perms?.can_list_products ?? true,
          can_add_stock: perms?.can_add_stock ?? false,
          can_remove_stock: perms?.can_remove_stock ?? false,
          can_edit_products: perms?.can_edit_products ?? false
        };

        setPermissions(safePerms);
      } catch (err) {
        console.error('❌ Failed to load role permissions:', err);
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [supabase]);

  return { permissions, loading };
}
