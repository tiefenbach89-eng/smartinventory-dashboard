'use client';
import {
  UserRound,
  ActivitySquare,
  ShieldCheck,
  Trash2,
  Lock,
  Unlock,
  Loader2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { RoleManagementTable } from '@/components/admin/RoleManagementTable';
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

// ---------------------------------------------------------------------------
// 🔹 MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function AccountsPage() {
  const router = useRouter();
  const supabase = createClient();
  const pathname = usePathname();
  const t = useTranslations('Accounts');

  // ---------- STATES ----------
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UIUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const { permissions, loading: loadingPerms } = useRolePermissions();

  const canAccessAdmin = permissions?.can_access_admin_panel;
  const canManageUsers = permissions?.can_manage_users;
  const canDeleteUsers = permissions?.can_delete_users;
  const isAdmin = permissions?.role === 'admin';

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
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();

    const channel = supabase
      .channel('user_roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        fetchUsers
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
    const loadActivity = async () => {
      await fetchActivity();
    };
    loadActivity();

    const channel = supabase
      .channel('artikel_log-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artikel_log' },
        fetchActivity
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
        return t('roleChanged', { role: newRole });
      })(),
      {
        loading: t('loadingUpdatingRole'),
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
      <div className='w-full space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-10'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-center text-xl font-bold tracking-tight sm:text-left sm:text-2xl'>
            {t('title')}
          </h2>
        </div>

        <Tabs defaultValue='users' className='w-full'>
          <TabsList className='bg-card/25 border-border/10 flex h-auto w-full flex-wrap items-center justify-center gap-2 rounded-3xl border px-2 py-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md sm:h-11 sm:w-fit sm:flex-nowrap sm:py-0'>
            <TabsTrigger
              value='users'
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(80,120,255,0.4)]'
            >
              <UserRound className='h-4 w-4 transition-colors duration-200 group-hover:text-blue-400' />
              {t('tabUsers')}
            </TabsTrigger>

            <TabsTrigger
              value='activity'
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(0,255,100,0.35)]'
            >
              <ActivitySquare className='h-4 w-4 transition-colors duration-200 group-hover:text-green-400' />
              {t('tabActivity')}
            </TabsTrigger>

            {canManageUsers && (
              <TabsTrigger
                value='roles'
                className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(80,160,255,0.35)]'
              >
                <ShieldCheck className='h-4 w-4 transition-colors duration-200 group-hover:text-sky-400' />
                {t('tabRoles')}
              </TabsTrigger>
            )}
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value='users' className='mt-6'>
            <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
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
                  <div className='border-border/40 bg-card/60 overflow-x-auto rounded-xl border shadow-sm backdrop-blur-sm'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('colUser')}</TableHead>
                          <TableHead>{t('colRole')}</TableHead>
                          <TableHead>{t('colStatusApproval')}</TableHead>
                          <TableHead>{t('colCreated')}</TableHead>
                          <TableHead>{t('colLastLogin')}</TableHead>
                          <TableHead className='text-right'>
                            {t('colActions')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className='flex flex-col'>
                                <span className='font-semibold'>
                                  {u.user_metadata?.first_name}{' '}
                                  {u.user_metadata?.last_name}
                                </span>
                                <span className='text-muted-foreground text-sm'>
                                  {u.email}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell>
                              {isAdmin ? (
                                <Select
                                  defaultValue={u.role ?? 'viewer'}
                                  onValueChange={(val) =>
                                    handleRoleChange(u.id, val)
                                  }
                                >
                                  <SelectTrigger className='bg-background border-border/50 w-[140px]'>
                                    <SelectValue
                                      placeholder={u.role ?? 'viewer'}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value='admin'>Admin</SelectItem>
                                    <SelectItem value='manager'>
                                      Manager
                                    </SelectItem>
                                    <SelectItem value='operator'>
                                      Operator
                                    </SelectItem>
                                    <SelectItem value='viewer'>
                                      Viewer
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <span className='text-muted-foreground'>
                                  {u.role || 'viewer'}
                                </span>
                              )}
                            </TableCell>

                            {/* Combined Status + Approval */}
                            <TableCell>
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
                            </TableCell>

                            {/* Created */}
                            <TableCell>
                              {new Date(u.created_at).toLocaleDateString(
                                'en-GB'
                              )}
                            </TableCell>

                            {/* Last Login */}
                            <TableCell>
                              {u.last_sign_in_at
                                ? new Date(
                                    u.last_sign_in_at
                                  ).toLocaleDateString('en-GB')
                                : '—'}
                            </TableCell>

                            <TableCell className='text-right'>
                              <div className='flex flex-wrap justify-end gap-2'>
                                {/* Ban / Unban */}
                                {canManageUsers && (
                                  <Button
                                    size='sm'
                                    onClick={() => toggleBan(u.id, u.banned)}
                                    className={`border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 ${
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

                                {/* Approve */}
                                {canManageUsers && (
                                  <Button
                                    size='sm'
                                    onClick={() => approveUser(u.id)}
                                    disabled={u.approved}
                                    className={`border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-yellow-500 hover:shadow-[0_0_10px_-2px_rgba(234,179,8,0.5)] ${
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

                                {/* Delete mit Dialog */}
                                {canDeleteUsers && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size='sm'
                                        className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-red-500 hover:shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]'
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
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </CardModern>
          </TabsContent>

          {/* ACTIVITY TAB */}
          <TabsContent value='activity' className='mt-6'>
            <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
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
          </TabsContent>

          {/* ROLE MANAGEMENT TAB */}
          {canManageUsers && (
            <TabsContent value='roles' className='mt-6'>
              <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
                <CardHeader>
                  <CardTitle>{t('roleManagementTitle')}</CardTitle>
                  <CardDescription>
                    {t('roleManagementDescription')}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className='overflow-x-auto'>
                    <RoleManagementTable />
                  </div>
                </CardContent>
              </CardModern>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageContainer>
  );
}
