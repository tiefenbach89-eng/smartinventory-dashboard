// src/app/dashboard/accounts/page.tsx
'use client';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip';

import {
  UserRound,
  ActivitySquare,
  ShieldCheck,
  Trash2,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import {
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { CardModern } from '@/components/ui/card-modern';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

// ---------------------------------------------------------------------------
// 🔹 TYPES
// ---------------------------------------------------------------------------
type UIUser = {
  id: string;
  email: string | null;
  role: string | null;
  banned: boolean;
  approved: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  user_metadata?: {
    first_name?: string;
    last_name?: string;
  };
};

type ActivityRow = {
  timestamp: string;
  benutzer: string | null;
  artikelname: string | null;
  menge_diff: number;
  kommentar: string | null;
  lieferscheinnr?: string | null;
};

type RoleKey = 'admin' | 'manager' | 'employee';

// ---------------------------------------------------------------------------
// 🔹 MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function AccountsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();

  const t = useTranslations('Accounts');
  const tRoles = useTranslations('Roles');

  // ---------- STATES ----------
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UIUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'activity'>('users');
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserFirstName, setNewUserFirstName] = useState('');
  const [newUserLastName, setNewUserLastName] = useState('');
  const [newUserRole, setNewUserRole] = useState<RoleKey>('employee');

  // Password reset state
  const [resetPasswordDialog, setResetPasswordDialog] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<UIUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const { permissions, loading: loadingPerms } = useRolePermissions();

  const canAccessAdmin = permissions.can_access_admin_panel;
  const canManageUsers = permissions.can_manage_users;
  const canDeleteUsers = permissions.can_delete_users;
  const isAdmin = permissions.role === 'admin';

  // Rollen-Metadaten (Labels + Beschreibungen, voll übersetzt) - Operator entfernt
  const roleOptions: { value: RoleKey; label: string; desc: string }[] = [
    {
      value: 'admin',
      label: tRoles('admin'),
      desc: tRoles('admin_desc')
    },
    {
      value: 'manager',
      label: tRoles('manager'),
      desc: tRoles('manager_desc')
    },
    {
      value: 'employee',
      label: tRoles('employee'),
      desc: tRoles('employee_desc')
    }
  ];

  const getRoleMeta = (role: string | null | undefined) => {
    const key = (role as RoleKey) || 'employee';
    return (
      roleOptions.find((r) => r.value === key) ||
      roleOptions.find((r) => r.value === 'employee')!
    );
  };

  // ---------------------------------------------------------------------------
  // 🔹 USERS LADEN
  // ---------------------------------------------------------------------------
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json.error)
        throw new Error(json.error || t('toggleFailed'));
      setUsers(json.users || []);
    } catch {
      toast.error(t('toastErrorLoadUsers'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('user_roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          // bei Änderungen Users neu laden
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // 🔹 ACTIVITY LADEN
  // ---------------------------------------------------------------------------
  async function fetchActivity() {
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/activity', { cache: 'no-store' });
      const json = await res.json();
      setActivity(json.data || []);
    } catch {
      toast.error(t('toastErrorLoadActivity'));
    } finally {
      setLoadingActivity(false);
    }
  }

  useEffect(() => {
    fetchActivity();

    const channel = supabase
      .channel('artikel_log-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artikel_log' },
        () => {
          fetchActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // ---------------------------------------------------------------------------
  // 🔹 ACTIONS
  // ---------------------------------------------------------------------------
  async function toggleBan(userId: string, currentBan: boolean) {
    if (!canManageUsers) return toast.error(t('noPermissionBan'));

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error(t('unauthorized'));

        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ user_id: userId, banned: !currentBan })
        });

        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || t('toggleFailed'));

        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, banned: !currentBan } : u))
        );

        return !currentBan ? t('userBanned') : t('userUnbanned');
      })(),
      {
        loading: t('loadingApplyingChange'),
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function approveUser(userId: string) {
    if (!canManageUsers) return toast.error(t('noPermissionApprove'));

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error(t('unauthorized'));

        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: userId,
            approved: true,
            banned: false
          })
        });

        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || t('approvalFailed'));

        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, approved: true, banned: false } : u
          )
        );

        return t('userApproved');
      })(),
      {
        loading: t('loadingApproving'),
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function deleteUser(userId: string) {
    if (!canDeleteUsers) return toast.error(t('noPermissionDelete'));

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error(t('unauthorized'));

        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ user_id: userId })
        });

        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || t('deleteFailed'));

        setUsers((prev) => prev.filter((u) => u.id !== userId));
        return t('userDeleted');
      })(),
      {
        loading: t('loadingDeletingUser'),
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!isAdmin) return toast.error(t('onlyAdminsChangeRoles'));

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error(t('noSession'));

        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ user_id: userId, role: newRole })
        });

        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || t('roleUpdateFailed'));

        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );

        // Rolle im Toast übersetzt ausgeben
        const meta = getRoleMeta(newRole);
        return t('roleChanged', { role: meta.label });
      })(),
      {
        loading: t('loadingUpdatingRole'),
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function createUser() {
    if (!isAdmin) return toast.error(t('onlyAdminsCreate'));

    if (!newUserEmail || !newUserPassword || !newUserFirstName || !newUserLastName) {
      return toast.error('Bitte alle Felder ausfüllen.');
    }

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('Keine Sitzung gefunden');

        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            email: newUserEmail,
            password: newUserPassword,
            first_name: newUserFirstName,
            last_name: newUserLastName,
            role: newUserRole
          })
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Benutzer konnte nicht erstellt werden');
        }

        // Reset form
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFirstName('');
        setNewUserLastName('');
        setNewUserRole('employee');
        setCreateUserDialog(false);

        // Refresh user list
        await fetchUsers();

        return 'Benutzer erfolgreich erstellt';
      })(),
      {
        loading: 'Benutzer wird erstellt...',
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function resetPassword() {
    if (!isAdmin || !resetPasswordUser) return;

    if (!newPassword || newPassword.length < 6) {
      return toast.error('Passwort muss mindestens 6 Zeichen lang sein');
    }

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('Keine Sitzung gefunden');

        const res = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          },
          body: JSON.stringify({
            user_id: resetPasswordUser.id,
            new_password: newPassword
          })
        });

        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || 'Passwort konnte nicht geändert werden');
        }

        setNewPassword('');
        setResetPasswordDialog(false);
        setResetPasswordUser(null);

        return 'Passwort erfolgreich geändert';
      })(),
      {
        loading: 'Passwort wird geändert...',
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  // ---------------------------------------------------------------------------
  // 🔹 ACCESS CHECK
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!loadingPerms && !canAccessAdmin && pathname !== '/access-denied') {
      router.replace('/access-denied');
    }
  }, [loadingPerms, canAccessAdmin, pathname, router]);

  if (loadingPerms)
    return (
      <div className='text-muted-foreground flex h-[80vh] items-center justify-center'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        {t('checkingAccess')}
      </div>
    );

  if (!canAccessAdmin) return null;

  // ---------------------------------------------------------------------------
  // 🔹 RENDER
  // ---------------------------------------------------------------------------
  return (
    <PageContainer>
      <div className='w-full space-y-6 px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-10 lg:px-12'>
        {/* Page Header */}
        <div className='relative overflow-hidden rounded-2xl border border-primary/12 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent dark:border-primary/15 dark:from-primary/12 dark:via-primary/6'>
          <div className='absolute -top-6 -right-6 h-32 w-32 rounded-full bg-primary/8 blur-3xl dark:bg-primary/12' />
          <div className='relative px-6 py-6 sm:px-8'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
              <div className='space-y-2'>
                <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 dark:border-primary/25 dark:bg-primary/12'>
                  <ShieldCheck className='h-3.5 w-3.5 text-primary' />
                  <span className='text-xs font-semibold uppercase tracking-widest text-primary'>
                    Admin Panel
                  </span>
                </div>
                <h1 className='text-2xl font-black tracking-tight sm:text-3xl'>
                  <span className='bg-gradient-to-br from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-transparent'>
                    {t('title')}
                  </span>
                </h1>
              </div>

              {/* Create User Button */}
              {isAdmin && activeTab === 'users' && (
                <Button
                  size='sm'
                  onClick={() => setCreateUserDialog(true)}
                  className='gap-2 rounded-xl font-semibold shadow-lg shadow-primary/20'
                >
                  <UserRound className='h-4 w-4' />
                  {t('createUser')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='flex gap-2'>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'users'
                ? 'bg-primary/10 text-primary dark:bg-primary/15'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <UserRound className='h-4 w-4' />
            {t('tabUsers')}
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              activeTab === 'activity'
                ? 'bg-primary/10 text-primary dark:bg-primary/15'
                : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
            }`}
          >
            <ActivitySquare className='h-4 w-4' />
            {t('tabActivity')}
          </button>
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            <CardModern className='overflow-hidden rounded-2xl border border-border/60 p-5 shadow-sm sm:p-7 dark:border-border/40'>
              <CardHeader>
                <CardTitle>{t('userManagementTitle')}</CardTitle>
                <CardDescription>
                  {t('userManagementDescription')}
                </CardDescription>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className='flex justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                ) : (
                  <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
                    {users.map((u) => {
                      const meta = getRoleMeta(u.role);

                      return (
                        <div
                          key={u.id}
                          className='group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-border/40'
                        >
                          {/* Subtle Pattern */}
                          <div className='absolute inset-0 -z-10 opacity-[0.02]'>
                            <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
                          </div>

                          {/* User Avatar & Name */}
                          <div className='mb-4 flex items-start gap-3'>
                            <Avatar className='h-12 w-12 shrink-0 rounded-xl shadow-inner'>
                              <AvatarImage
                                src={(u.user_metadata as any)?.avatar_url || ''}
                                alt={`${u.user_metadata?.first_name || ''} ${u.user_metadata?.last_name || ''}`.trim() || u.email || 'User'}
                                className='rounded-xl'
                              />
                              <AvatarFallback className='rounded-xl bg-primary/10 text-primary font-bold'>
                                {(u.user_metadata?.first_name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                                {(u.user_metadata?.last_name?.[0] || '').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className='flex-1 overflow-hidden'>
                              <div className='truncate font-bold'>
                                {u.user_metadata?.first_name}{' '}
                                {u.user_metadata?.last_name}
                              </div>
                              <div className='text-muted-foreground truncate text-xs'>
                                {u.email}
                              </div>
                            </div>
                          </div>

                          {/* Role Selector or Display */}
                          <div className='mb-3 space-y-1'>
                            <div className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider'>
                              {t('colRole')}
                            </div>
                            <div className='flex items-center gap-2'>
                              {isAdmin ? (
                                <Select
                                  defaultValue={
                                    (u.role as RoleKey) ?? 'employee'
                                  }
                                  onValueChange={(val) =>
                                    handleRoleChange(u.id, val)
                                  }
                                >
                                  <SelectTrigger className='bg-background border-border/50 h-9 w-full rounded-xl'>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {roleOptions.map((r) => (
                                      <SelectItem
                                        key={r.value}
                                        value={r.value}
                                      >
                                        {r.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className='text-foreground font-medium'>
                                  {meta.label}
                                </span>
                              )}

                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger className='border-border/60 text-muted-foreground hover:bg-muted/40 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]'>
                                    i
                                  </TooltipTrigger>
                                  <TooltipContent className='max-w-xs text-xs leading-relaxed'>
                                    <p className='mb-1 font-medium'>
                                      {meta.label}
                                    </p>
                                    <p>{meta.desc}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>

                          {/* Status Badges */}
                          <div className='mb-3 space-y-1'>
                            <div className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider'>
                              {t('status')}
                            </div>
                            <div className='flex flex-wrap gap-2'>
                              {u.banned ? (
                                <Badge className='rounded-lg border border-red-500/20 bg-red-500/15 px-2 py-[2px] text-xs font-medium text-red-400 backdrop-blur-sm'>
                                  {t('statusBanned')}
                                </Badge>
                              ) : (
                                <Badge className='rounded-lg border border-green-500/20 bg-green-500/15 px-2 py-[2px] text-xs font-medium text-green-400 backdrop-blur-sm'>
                                  {t('statusActive')}
                                </Badge>
                              )}

                              {u.approved ? (
                                <Badge className='rounded-lg border border-emerald-500/20 bg-emerald-500/15 px-2 py-[2px] text-xs font-medium text-emerald-400 backdrop-blur-sm'>
                                  {t('statusApproved')}
                                </Badge>
                              ) : (
                                <Badge className='rounded-lg border border-yellow-500/20 bg-yellow-500/15 px-2 py-[2px] text-xs font-medium text-yellow-400 backdrop-blur-sm'>
                                  {t('statusPending')}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Dates */}
                          <div className='mb-4 grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <div className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider'>
                                {t('colCreated')}
                              </div>
                              <div className='font-medium'>
                                {new Date(u.created_at).toLocaleDateString(
                                  'en-GB'
                                )}
                              </div>
                            </div>
                            <div>
                              <div className='text-muted-foreground text-[10px] font-semibold uppercase tracking-wider'>
                                {t('colLastLogin')}
                              </div>
                              <div className='font-medium'>
                                {u.last_sign_in_at
                                  ? new Date(
                                      u.last_sign_in_at
                                    ).toLocaleDateString('en-GB')
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className='mt-auto flex flex-wrap gap-2'>
                            {canManageUsers && (
                              <Button
                                size='sm'
                                onClick={() => toggleBan(u.id, u.banned)}
                                className={`flex-1 border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-9 min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-all duration-200 ${
                                  u.banned
                                    ? 'hover:text-emerald-500 hover:shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]'
                                    : 'hover:text-red-500 hover:shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]'
                                }`}
                              >
                                {u.banned ? (
                                  <>
                                    <Unlock className='mr-1 h-4 w-4' />{' '}
                                    {t('btnUnban')}
                                  </>
                                ) : (
                                  <>
                                    <Lock className='mr-1 h-4 w-4' />{' '}
                                    {t('btnBan')}
                                  </>
                                )}
                              </Button>
                            )}

                            {canManageUsers && (
                              <Button
                                size='sm'
                                onClick={() => approveUser(u.id)}
                                disabled={u.approved}
                                className={`flex-1 border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-9 min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-all duration-200 hover:text-yellow-500 hover:shadow-[0_0_10px_-2px_rgba(234,179,8,0.5)] ${
                                  u.approved
                                    ? 'cursor-default opacity-70'
                                    : ''
                                }`}
                              >
                                {u.approved ? (
                                  <>
                                    <ShieldCheck className='mr-1 h-4 w-4 text-yellow-500' />{' '}
                                    {t('btnApproved')}
                                  </>
                                ) : (
                                  <>
                                    <ShieldCheck className='mr-1 h-4 w-4' />{' '}
                                    {t('btnApprove')}
                                  </>
                                )}
                              </Button>
                            )}

                            {isAdmin && (
                              <Button
                                size='sm'
                                onClick={() => {
                                  setResetPasswordUser(u);
                                  setResetPasswordDialog(true);
                                }}
                                className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 flex-1 relative h-9 min-h-[44px] rounded-xl border px-3 text-xs font-semibold transition-all duration-200 hover:text-blue-500 hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.5)]'
                              >
                                <Lock className='mr-1 h-4 w-4' />
                                {t('changePassword')}
                              </Button>
                            )}

                            {canDeleteUsers && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size='sm'
                                    className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-9 min-h-[44px] w-full rounded-xl border px-3 text-xs font-semibold transition-all duration-200 hover:text-red-500 hover:shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]'
                                  >
                                    <Trash2 className='mr-1 h-4 w-4' />{' '}
                                    {t('btnDelete')}
                                  </Button>
                                </AlertDialogTrigger>

                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {t('dialogDeleteTitle')}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {t('dialogDeleteDescription')}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      {t('dialogCancel')}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUser(u.id)}
                                    >
                                      {t('dialogDelete')}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </CardModern>
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div>
            <CardModern className='overflow-hidden rounded-2xl border border-border/60 p-5 shadow-sm sm:p-7 dark:border-border/40'>
              <CardHeader>
                <CardTitle>{t('activityTitle')}</CardTitle>
                <CardDescription>{t('activityDescription')}</CardDescription>
              </CardHeader>

              <CardContent>
                {loadingActivity ? (
                  <div className='flex justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                ) : activity.length === 0 ? (
                  <p className='text-muted-foreground py-6 text-center text-sm'>
                    {t('emptyActivity')}
                  </p>
                ) : (
                  <div className='border-border/40 from-muted/40 to-muted/10 overflow-x-auto rounded-2xl border bg-gradient-to-b shadow-md backdrop-blur-sm'>
                    <Table className='text-sm'>
                      <TableHeader>
                        <TableRow className='border-border/20'>
                          <TableHead className='text-muted-foreground w-[120px]'>
                            {t('activityColDate')}
                          </TableHead>
                          <TableHead className='text-muted-foreground min-w-[160px]'>
                            {t('activityColUser')}
                          </TableHead>
                          <TableHead className='text-muted-foreground w-[120px]'>
                            {t('activityColAction')}
                          </TableHead>
                          <TableHead className='text-muted-foreground min-w-[160px]'>
                            {t('activityColArticle')}
                          </TableHead>
                          <TableHead className='text-muted-foreground w-[80px] text-right'>
                            {t('activityColQty')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {activity.map((a, i) => (
                          <TableRow
                            key={i}
                            className='hover:bg-muted/50 rounded-lg transition-colors duration-150'
                          >
                            <TableCell className='text-muted-foreground'>
                              {new Date(a.timestamp).toLocaleDateString(
                                'de-DE'
                              )}
                            </TableCell>

                            <TableCell className='font-medium'>
                              {a.benutzer || '—'}
                            </TableCell>

                            <TableCell>
                              {a.menge_diff >= 0 ? (
                                <Badge
                                  variant='outline'
                                  className='rounded-xl border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 font-medium text-emerald-400'
                                >
                                  {t('actionAdded')}
                                </Badge>
                              ) : (
                                <Badge
                                  variant='outline'
                                  className='rounded-xl border-red-500/30 bg-red-500/10 px-3 py-0.5 font-medium text-red-400'
                                >
                                  {t('actionRemoved')}
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell>{a.artikelname || '—'}</TableCell>

                            <TableCell className='text-right font-semibold'>
                              {a.menge_diff}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CardModern>
          </div>
        )}

        {/* Create User Dialog */}
        <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{t('createUserTitle')}</DialogTitle>
              <DialogDescription>
                Erstellen Sie einen neuen Benutzer ohne Registrierung
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Vorname</label>
                  <Input
                    value={newUserFirstName}
                    onChange={(e) => setNewUserFirstName(e.target.value)}
                    placeholder='Max'
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>Nachname</label>
                  <Input
                    value={newUserLastName}
                    onChange={(e) => setNewUserLastName(e.target.value)}
                    placeholder='Mustermann'
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>E-Mail</label>
                <Input
                  type='email'
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder='max.mustermann@example.com'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>Passwort</label>
                <Input
                  type='password'
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder='Mindestens 6 Zeichen'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>Rolle</label>
                <Select value={newUserRole} onValueChange={(val) => setNewUserRole(val as RoleKey)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setCreateUserDialog(false);
                    setNewUserEmail('');
                    setNewUserPassword('');
                    setNewUserFirstName('');
                    setNewUserLastName('');
                    setNewUserRole('employee');
                  }}
                >
                  {t('dialogCancel')}
                </Button>
                <Button onClick={createUser}>
                  {t('createUser')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reset Password Dialog */}
        <Dialog open={resetPasswordDialog} onOpenChange={setResetPasswordDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>{t('changePasswordTitle')}</DialogTitle>
              <DialogDescription>
                Neues Passwort für {resetPasswordUser?.user_metadata?.first_name} {resetPasswordUser?.user_metadata?.last_name} ({resetPasswordUser?.email})
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium'>Neues Passwort</label>
                <Input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder='Mindestens 6 Zeichen'
                  autoComplete='new-password'
                />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setResetPasswordDialog(false);
                    setNewPassword('');
                    setResetPasswordUser(null);
                  }}
                >
                  {t('dialogCancel')}
                </Button>
                <Button onClick={resetPassword}>
                  {t('changePassword')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
