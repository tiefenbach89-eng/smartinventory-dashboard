// app/api/admin/roles/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET – Ruft alle Rollen und Berechtigungen aus der role_permissions-Tabelle ab
 */
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('role_permissions')
    .select('*')
    .order('role', { ascending: true });

  if (error) {
    console.error('❌ Supabase GET error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ roles: data ?? [] }, { status: 200 });
}

/**
 * PATCH – Aktualisiert oder legt eine Rolle neu an (inkl. Subrechte-Mapping)
 */
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    const {
      role,
      can_access_admin_panel = false,
      can_manage_users = false,
      can_delete_users = false,
      can_manage_products = false,
      can_adjust_stock = false,
      can_delete_products = false
    } = body;

    if (!role || typeof role !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid role name' },
        { status: 400 }
      );
    }

    // 🧩 Automatisches Mapping der Subrechte
    const mappedPermissions = {
      role,
      can_access_admin_panel,
      can_manage_users,
      can_delete_users,
      can_manage_products,
      can_adjust_stock,
      can_delete_products,

      // 🔹 Subrechte automatisch ableiten
      can_add_stock: can_adjust_stock,
      can_remove_stock: can_adjust_stock,
      can_list_products: can_manage_products,
      can_edit_products: can_manage_products
    };

    // 🔹 Rolle upsert (insert or update)
    const { error } = await supabase
      .from('role_permissions')
      .upsert(mappedPermissions, { onConflict: 'role' });

    if (error) {
      console.error('❌ Supabase PATCH error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { ok: true, role: mappedPermissions },
      { status: 200 }
    );
  } catch (err: any) {
    console.error('❌ Unexpected PATCH error:', err.message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
