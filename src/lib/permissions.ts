// src/lib/permissions.ts

export type Role = 'admin' | 'manager' | 'employee';

export type RolePermissions = {
  can_access_admin_panel: boolean;
  can_manage_users: boolean;
  can_delete_users: boolean;
  can_manage_products: boolean;
  can_adjust_stock: boolean;
  can_delete_products: boolean;
};

export type RoleWithPermissions = RolePermissions & {
  role: Role;
};

// 🔒 Fixes Rollenmodell (UI-only, aber sauber definiert)
export const ROLE_PERMISSIONS: Record<Role, RolePermissions> = {
  admin: {
    // Admin = alles
    can_access_admin_panel: true,
    can_manage_users: true,
    can_delete_users: true,
    can_manage_products: true,
    can_adjust_stock: true,
    can_delete_products: true
  },
  manager: {
    // Manager = alles außer User löschen & Produkte löschen
    can_access_admin_panel: true, // darf ins Accounts-Panel
    can_manage_users: true, // darf sperren/freigeben
    can_delete_users: false, // ❌ darf NICHT löschen
    can_manage_products: true, // darf Produkte/Fässer anlegen/bearbeiten
    can_adjust_stock: true, // darf Bestand ändern
    can_delete_products: false // ❌ keine Produkte/Fässer löschen
  },
  employee: {
    // Employee = nur Lagerbewegungen (entnehmen), keine Produktpflege
    can_access_admin_panel: false,
    can_manage_users: false,
    can_delete_users: false,
    can_manage_products: false, // ❌ keine neuen Produkte / Edit
    can_adjust_stock: true, // ✅ darf nur entnehmen (bei Fässern)
    can_delete_products: false
  }
};

// Helper: robust auch bei unbekannten Rollen / null
export function getPermissionsForRole(
  role: Role | string | null | undefined
): RoleWithPermissions {
  const asRole =
    role && Object.prototype.hasOwnProperty.call(ROLE_PERMISSIONS, role)
      ? (role as Role)
      : 'employee';

  return {
    role: asRole,
    ...ROLE_PERMISSIONS[asRole]
  };
}
