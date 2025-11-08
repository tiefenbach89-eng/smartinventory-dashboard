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
        throw new Error(json.error || 'Failed to load users');
      setUsers(json.users || []);
    } catch {
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // async Aufruf sauber kapseln
    const loadUsers = async () => {
      await fetchUsers();
    };
    loadUsers();

    // Supabase Realtime für user_roles
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
      toast.error('Error loading activity');
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
    if (!canManageUsers) return toast.error('No permission to ban users');
    toast.promise(
      (async () => {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, banned: !currentBan })
        });
        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || 'Toggle failed');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, banned: !currentBan } : u))
        );
        return !currentBan ? 'User banned' : 'User unbanned';
      })(),
      {
        loading: 'Applying change...',
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function approveUser(userId: string) {
    if (!canManageUsers) return toast.error('No permission to approve users');
    toast.promise(
      (async () => {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            approved: true,
            banned: false
          })
        });
        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || 'Approval failed');
        setUsers((prev) =>
          prev.map((u) =>
            u.id === userId ? { ...u, approved: true, banned: false } : u
          )
        );
        return 'User approved successfully';
      })(),
      { loading: 'Approving...', success: (m) => m, error: (e) => String(e) }
    );
  }

  async function deleteUser(userId: string) {
    if (!canDeleteUsers) return toast.error('No permission to delete users');
    toast.promise(
      (async () => {
        const res = await fetch('/api/admin/users', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId })
        });
        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || 'Delete failed');
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        return 'User deleted';
      })(),
      {
        loading: 'Deleting user...',
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!isAdmin) return toast.error('Only admins can change roles');
    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('No session found');
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
          throw new Error(json.error || 'Role update failed');
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        return `Role changed to "${newRole}"`;
      })(),
      {
        loading: 'Updating role...',
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
        Checking access...
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
            Accounts
          </h2>
        </div>

        <Tabs defaultValue='users' className='w-full'>
          <TabsList className='bg-card/25 border-border/10 flex h-auto w-full flex-wrap items-center justify-center gap-2 rounded-3xl border px-2 py-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md sm:h-11 sm:w-fit sm:flex-nowrap sm:py-0'>
            <TabsTrigger
              value='users'
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(80,120,255,0.4)]'
            >
              <UserRound className='h-4 w-4 transition-colors duration-200 group-hover:text-blue-400' />
              Users
            </TabsTrigger>

            <TabsTrigger
              value='activity'
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(0,255,100,0.35)]'
            >
              <ActivitySquare className='h-4 w-4 transition-colors duration-200 group-hover:text-green-400' />
              Activity
            </TabsTrigger>

            {canManageUsers && (
              <TabsTrigger
                value='roles'
                className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(80,160,255,0.35)]'
              >
                <ShieldCheck className='h-4 w-4 transition-colors duration-200 group-hover:text-sky-400' />
                Role Management
              </TabsTrigger>
            )}
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value='users' className='mt-6'>
            <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage roles, bans, and access control.
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
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className='text-right'>Actions</TableHead>
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

                            <TableCell>
                              {u.banned ? (
                                <Badge className='bg-red-500/20 text-red-500'>
                                  Banned
                                </Badge>
                              ) : (
                                <Badge className='bg-green-500/20 text-green-600'>
                                  Active
                                </Badge>
                              )}
                            </TableCell>

                            <TableCell>
                              {u.approved ? 'Yes' : 'Pending'}
                            </TableCell>
                            <TableCell>
                              {new Date(u.created_at).toLocaleDateString(
                                'en-GB'
                              )}
                            </TableCell>

                            <TableCell className='text-right'>
                              <div className='flex justify-end gap-2'>
                                {canManageUsers && (
                                  <Button
                                    size='icon'
                                    variant='outline'
                                    onClick={() => toggleBan(u.id, u.banned)}
                                  >
                                    {u.banned ? (
                                      <Unlock className='h-4 w-4 text-green-500' />
                                    ) : (
                                      <Lock className='h-4 w-4 text-red-500' />
                                    )}
                                  </Button>
                                )}
                                {canManageUsers && (
                                  <Button
                                    size='sm'
                                    className='bg-yellow-500 text-black hover:bg-yellow-600'
                                    onClick={() => approveUser(u.id)}
                                  >
                                    {u.approved ? 'Approved' : 'Approve'}
                                  </Button>
                                )}
                                {canDeleteUsers && (
                                  <Button
                                    size='icon'
                                    variant='destructive'
                                    onClick={() => deleteUser(u.id)}
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
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
                <CardTitle>User Activity (30 Days)</CardTitle>
                <CardDescription>
                  Recent stock actions by users.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className='flex justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                ) : (
                  <div className='border-border/40 bg-card/60 overflow-x-auto rounded-xl border shadow-sm backdrop-blur-sm'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Article</TableHead>
                          <TableHead>Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activity.map((a, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              {new Date(a.timestamp).toLocaleDateString(
                                'en-GB'
                              )}
                            </TableCell>
                            <TableCell>{a.benutzer || '—'}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  a.menge_diff >= 0
                                    ? 'bg-green-500/20 text-green-600'
                                    : 'bg-red-500/20 text-red-500'
                                }
                              >
                                {a.menge_diff >= 0 ? 'Added' : 'Removed'}
                              </Badge>
                            </TableCell>
                            <TableCell>{a.artikelname || '—'}</TableCell>
                            <TableCell>{a.menge_diff}</TableCell>
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
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Define what each role can do across the system.
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
