'use client';

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
import {
  Loader2,
  User,
  Activity,
  Trash2,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
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

  // ---------- STATES ----------
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UIUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const { permissions, loading: loadingPerms } = useRolePermissions();

  // ---------- PERMISSIONS ----------
  const canAccessAdmin = permissions?.can_access_admin_panel;
  const canManageUsers = permissions?.can_manage_users;
  const canDeleteUsers = permissions?.can_delete_users;
  const isAdmin = permissions?.role === 'admin';

  // ---------------------------------------------------------------------------
  // 🔹 LOAD USERS
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
    const load = async () => await fetchUsers();
    load();

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
  // 🔹 LOAD ACTIVITY
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
    const load = async () => await fetchActivity();
    load();

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

  // 🔹 Nur Admin darf Rollen ändern
  async function handleRoleChange(userId: string, newRole: string) {
    if (!isAdmin) return toast.error('Only admins can change roles');

    toast.promise(
      (async () => {
        const supabase = createClient();
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();

        if (sessionError || !session)
          throw new Error('Failed to retrieve session');

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
  // 🔹 Redirect if no admin access (but skip on /access-denied)
  // ---------------------------------------------------------------------------
  const pathname = usePathname();

  useEffect(() => {
    if (!loadingPerms && !canAccessAdmin && pathname !== '/access-denied') {
      router.replace('/access-denied');
    }
  }, [loadingPerms, canAccessAdmin, pathname, router]);

  // ---------------------------------------------------------------------------
  // 🔹 PREVENT RENDER GLITCH
  // ---------------------------------------------------------------------------
  if (loadingPerms) {
    return (
      <div className='text-muted-foreground flex h-[80vh] items-center justify-center'>
        <Loader2 className='mr-2 h-5 w-5 animate-spin' />
        Checking access...
      </div>
    );
  }

  if (!canAccessAdmin) {
    return null; // 🧠 Falls kein Zugriff, rendern wir nichts (Redirect erledigt den Rest)
  }

  // ---------------------------------------------------------------------------
  // 🔹 RENDER
  // ---------------------------------------------------------------------------
  return (
    <PageContainer>
      <div className='w-full space-y-6 px-6 py-10'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Accounts</h2>
        </div>

        <Tabs defaultValue='users' className='w-full'>
          <TabsList className='bg-card/40 border-border/40 rounded-xl border backdrop-blur-sm'>
            <TabsTrigger value='users' className='flex items-center gap-2'>
              <User className='h-4 w-4' /> Users
            </TabsTrigger>
            <TabsTrigger value='activity' className='flex items-center gap-2'>
              <Activity className='h-4 w-4' /> Activity
            </TabsTrigger>
            {canManageUsers && (
              <TabsTrigger value='roles' className='flex items-center gap-2'>
                <ShieldAlert className='h-4 w-4' /> Role Management
              </TabsTrigger>
            )}
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value='users' className='mt-6'>
            <CardModern className='space-y-8 p-8'>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage access, roles, bans, approvals & email verification
                </CardDescription>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <div className='flex justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                ) : (
                  <div className='border-border/40 bg-card/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm'>
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
            <CardModern className='space-y-8 p-8'>
              <CardHeader>
                <CardTitle>User Activity (30 Days)</CardTitle>
                <CardDescription>Recent stock actions by users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingActivity ? (
                  <div className='flex justify-center py-6'>
                    <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                  </div>
                ) : (
                  <div className='border-border/40 bg-card/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm'>
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
              <CardModern className='space-y-8 p-8'>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>
                    Define what each role can do across the system.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RoleManagementTable />
                </CardContent>
              </CardModern>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </PageContainer>
  );
}
