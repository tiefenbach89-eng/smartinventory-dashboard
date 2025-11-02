'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';

// 🔸 Typisierung für Rollenrechte
type RoleRow = {
  role: string;
  can_access_admin_panel: boolean;
  can_manage_users: boolean;
  can_delete_users: boolean;
  can_manage_products: boolean;
  can_adjust_stock: boolean;
  can_delete_products: boolean;
};

// 🔹 Kompakte Rechte-Zusammenfassung
function RoleBadgesSummary(r: RoleRow) {
  return (
    <div className='flex flex-wrap gap-2'>
      <Badge
        variant='outline'
        className={
          r.can_access_admin_panel ? 'border-primary text-primary' : ''
        }
      >
        Admin Access
      </Badge>
      <Badge
        variant='outline'
        className={r.can_manage_users ? 'border-primary text-primary' : ''}
      >
        Manage Users
      </Badge>
      <Badge
        variant='outline'
        className={r.can_delete_users ? 'border-primary text-primary' : ''}
      >
        Delete Users
      </Badge>
      <Badge
        variant='outline'
        className={r.can_manage_products ? 'border-primary text-primary' : ''}
      >
        Manage Products
      </Badge>
      <Badge
        variant='outline'
        className={r.can_adjust_stock ? 'border-primary text-primary' : ''}
      >
        Adjust Stock
      </Badge>
      <Badge
        variant='outline'
        className={r.can_delete_products ? 'border-primary text-primary' : ''}
      >
        Delete Products
      </Badge>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 🧩 Hauptkomponente – Role Management Tabelle
// ---------------------------------------------------------------------------
export function RoleManagementTable() {
  const [rows, setRows] = useState<RoleRow[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const { permissions } = useRolePermissions();
  const isAdmin = permissions?.role === 'admin';

  // 🔹 Rollen aus Supabase laden
  async function load() {
    try {
      setLoadingRoles(true);
      const res = await fetch('/api/admin/roles', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load roles');
      setRows(json.roles || []);
    } catch (e: any) {
      toast.error('❌ Failed to load roles: ' + e.message);
    } finally {
      setLoadingRoles(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // 🔹 Änderungen speichern
  async function saveRow(r: RoleRow) {
    try {
      setSaving(r.role);
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(r)
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Update failed');
      toast.success(`Saved permissions for "${r.role}"`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(null);
    }
  }

  // 🔹 Checkbox toggeln
  function toggle(role: string, key: keyof RoleRow) {
    setRows((prev) =>
      prev.map((r) => (r.role === role ? { ...r, [key]: !r[key] } : r))
    );
  }

  // -------------------------------------------------------------------------
  // 🔹 Render
  // -------------------------------------------------------------------------
  if (loadingRoles) {
    return (
      <div className='text-muted-foreground flex justify-center py-10'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        Loading roles...
      </div>
    );
  }

  return (
    <div className='group relative'>
      {/* 🔒 Blur + sanft animiertes Overlay für Nicht-Admins */}
      <div
        className={`border-border/40 bg-card/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm transition-all duration-700 ease-in-out ${
          !isAdmin
            ? 'pointer-events-none opacity-60 blur-sm group-hover:blur-[2px]'
            : ''
        }`}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[140px]'>Role</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead className='text-center'>Admin Access</TableHead>
              <TableHead className='text-center'>Manage Users</TableHead>
              <TableHead className='text-center'>Delete Users</TableHead>
              <TableHead className='text-center'>Manage Products</TableHead>
              <TableHead className='text-center'>Adjust Stock</TableHead>
              <TableHead className='text-center'>Delete Products</TableHead>
              <TableHead className='text-right'>Save</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.role}>
                <TableCell className='font-semibold capitalize'>
                  {r.role}
                </TableCell>
                <TableCell>
                  <RoleBadgesSummary {...r} />
                </TableCell>

                {(
                  [
                    'can_access_admin_panel',
                    'can_manage_users',
                    'can_delete_users',
                    'can_manage_products',
                    'can_adjust_stock',
                    'can_delete_products'
                  ] as const
                ).map((key) => (
                  <TableCell key={key} className='text-center'>
                    <input
                      type='checkbox'
                      checked={r[key]}
                      onChange={() => toggle(r.role, key)}
                      className='accent-primary h-4 w-4 cursor-pointer'
                    />
                  </TableCell>
                ))}

                <TableCell className='text-right'>
                  <Button
                    size='sm'
                    onClick={() => saveRow(r)}
                    disabled={saving === r.role}
                  >
                    {saving === r.role ? 'Saving…' : 'Save'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* 🩶 Overlay Hinweis mit sanftem Fade-In */}
      {!isAdmin && (
        <div className='text-muted-foreground from-background/60 to-background/80 absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-b font-medium opacity-0 backdrop-blur-[2px] transition-opacity duration-700 ease-in-out group-hover:opacity-100'>
          <p className='text-center text-base'>
            🔒 Limited access — admin only
          </p>
        </div>
      )}

      {/* 📘 Beschreibungsblock unterhalb der Tabelle */}
      <div className='text-muted-foreground border-border/30 mt-8 space-y-2 border-t pt-4 text-sm'>
        <p>
          <strong>Admin Access:</strong> Grants access to administrative areas
          such as Accounts, Settings, and Role Management.
        </p>
        <p>
          <strong>Manage Users:</strong> Allows viewing, approving, or banning
          users, but not editing roles.
        </p>
        <p>
          <strong>Delete Users:</strong> Permanently removes users from the
          system (Admin only).
        </p>
        <p>
          <strong>Manage Products:</strong> Allows adding, editing, or
          deactivating products.
        </p>
        <p>
          <strong>Adjust Stock:</strong> Enables increasing or decreasing
          product inventory.
        </p>
        <p>
          <strong>Delete Products:</strong> Permanently removes products
          including their full history.
        </p>
      </div>
    </div>
  );
}
