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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('Accounts.roleTable');

  return (
    <div className='flex flex-wrap gap-2'>
      <Badge
        variant='outline'
        className={
          r.can_access_admin_panel ? 'border-primary text-primary' : ''
        }
      >
        {t('badgeAdmin')}
      </Badge>
      <Badge
        variant='outline'
        className={r.can_manage_users ? 'border-primary text-primary' : ''}
      >
        {t('badgeManageUsers')}
      </Badge>
      <Badge
        variant='outline'
        className={r.can_delete_users ? 'border-primary text-primary' : ''}
      >
        {t('badgeDeleteUsers')}
      </Badge>
      <Badge
        variant='outline'
        className={r.can_manage_products ? 'border-primary text-primary' : ''}
      >
        {t('badgeManageProducts')}
      </Badge>
      <Badge
        variant='outline'
        className={r.can_adjust_stock ? 'border-primary text-primary' : ''}
      >
        {t('badgeAdjustStock')}
      </Badge>
      <Badge
        variant='outline'
        className={r.can_delete_products ? 'border-primary text-primary' : ''}
      >
        {t('badgeDeleteProducts')}
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

  const t = useTranslations('Accounts.roleTable');

  // 🔹 Rollen aus Supabase laden
  async function load() {
    try {
      setLoadingRoles(true);
      const res = await fetch('/api/admin/roles', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load roles');
      setRows(json.roles || []);
    } catch (e: any) {
      toast.error(
        t('loadError', {
          message: e.message ?? ''
        })
      );
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
      toast.success(
        t('saveSuccess', {
          role: r.role
        })
      );
    } catch (e: any) {
      toast.error(
        t('saveError', {
          message: e.message ?? ''
        })
      );
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
        {t('loading')}
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
              <TableHead className='w-[140px]'>{t('role')}</TableHead>
              <TableHead>{t('summary')}</TableHead>
              <TableHead className='text-center'>
                {t('colAdminAccess')}
              </TableHead>
              <TableHead className='text-center'>
                {t('colManageUsers')}
              </TableHead>
              <TableHead className='text-center'>
                {t('colDeleteUsers')}
              </TableHead>
              <TableHead className='text-center'>
                {t('colManageProducts')}
              </TableHead>
              <TableHead className='text-center'>
                {t('colAdjustStock')}
              </TableHead>
              <TableHead className='text-center'>
                {t('colDeleteProducts')}
              </TableHead>
              <TableHead className='text-right'>{t('save')}</TableHead>
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
                    {saving === r.role ? t('saving') : t('save')}
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
          <p className='text-center text-base'>{t('overlayLimited')}</p>
        </div>
      )}

      {/* 📘 Beschreibungsblock unterhalb der Tabelle */}
      <div className='text-muted-foreground border-border/30 mt-8 space-y-2 border-t pt-4 text-sm'>
        <p>
          <strong>{t('admin_access')}</strong> {t('admin_access_desc')}
        </p>
        <p>
          <strong>{t('manage_users')}</strong> {t('manage_users_desc')}
        </p>
        <p>
          <strong>{t('delete_users')}</strong> {t('delete_users_desc')}
        </p>
        <p>
          <strong>{t('manage_products')}</strong> {t('manage_products_desc')}
        </p>
        <p>
          <strong>{t('adjust_stock')}</strong> {t('adjust_stock_desc')}
        </p>
        <p>
          <strong>{t('delete_products')}</strong> {t('delete_products_desc')}
        </p>
      </div>
    </div>
  );
}
