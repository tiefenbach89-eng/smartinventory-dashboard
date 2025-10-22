'use client';

import { useEffect, useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { Loader2, User, Activity, Trash2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

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
  lieferscheinnr?: string | null; // ✅ hinzugefügt
};

export default function AccountsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UIUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // ---------- USERS ----------
  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || json.error)
        throw new Error(json.error || 'Failed to load users');
      setUsers(json.users || []);
    } catch (err: any) {
      console.error('❌ Failed to load users:', err);
      toast.error('Error loading users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial load
    fetchUsers();

    // Realtime subscription for user_roles
    const channel = supabase
      .channel('user_roles-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        () => {
          // minimal debounce to avoid burst reloads
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- ACTIVITY ----------
  async function fetchActivity() {
    setLoadingActivity(true);
    try {
      const res = await fetch('/api/activity', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load activity');
      const json = await res.json();
      setActivity(json.data || []);
    } catch (err) {
      console.error('❌ Activity load failed:', err);
    } finally {
      setLoadingActivity(false);
    }
  }

  useEffect(() => {
    // initial
    fetchActivity();

    // Realtime subscription for artikel_log
    const channel = supabase
      .channel('artikel_log-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'artikel_log' },
        () => fetchActivity()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- ACTIONS ----------
  async function handleRoleChange(userId: string, newRole: string) {
    toast.promise(
      (async () => {
        const res = await fetch('/api/admin/users', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, role: newRole })
        });
        const json = await res.json();
        if (!res.ok || json.error)
          throw new Error(json.error || 'Update failed');
        // Realtime wird das UI aktualisieren; als UX-Boost können wir optimistisch sein:
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        return `Role updated to "${newRole}"`;
      })(),
      {
        loading: 'Updating role...',
        success: (m) => m,
        error: (e) => String(e)
      }
    );
  }

  async function toggleBan(userId: string, currentBan: boolean) {
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
    // schöner Toast statt Browser-confirm
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

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Accounts</h2>
        </div>

        <Tabs defaultValue='users' className='w-full'>
          <TabsList>
            <TabsTrigger value='users' className='flex items-center gap-2'>
              <User className='h-4 w-4' /> Users
            </TabsTrigger>
            <TabsTrigger value='activity' className='flex items-center gap-2'>
              <Activity className='h-4 w-4' /> Activity
            </TabsTrigger>
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value='users' className='mt-4'>
            <Card>
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
                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Email Verified</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Approved</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Last Sign-In</TableHead>
                          <TableHead className='text-right'>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id} className='align-middle'>
                            {/* 👤 Name + E-Mail */}
                            <TableCell className='align-middle whitespace-nowrap'>
                              <div className='flex flex-col justify-center leading-tight'>
                                <span className='text-foreground font-semibold'>
                                  {u.user_metadata?.first_name}{' '}
                                  {u.user_metadata?.last_name}
                                </span>
                                {u.email && (
                                  <span className='text-muted-foreground text-sm'>
                                    {u.email}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* 📧 Email Verified */}
                            <TableCell className='align-middle'>
                              <Badge
                                className={
                                  u.email_confirmed_at
                                    ? 'border-green-500/30 bg-green-500/20 text-green-600'
                                    : 'border-gray-500/30 bg-gray-500/20 text-gray-600'
                                }
                              >
                                {u.email_confirmed_at ? 'Yes' : 'No'}
                              </Badge>
                            </TableCell>

                            {/* 🧩 Role */}
                            <TableCell className='align-middle'>
                              <Select
                                defaultValue={u.role ?? 'viewer'}
                                onValueChange={(val) =>
                                  handleRoleChange(u.id, val)
                                }
                              >
                                <SelectTrigger className='w-[140px]'>
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
                                  <SelectItem value='viewer'>Viewer</SelectItem>
                                  <SelectItem value='guest'>Guest</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>

                            {/* 🔒 Status */}
                            <TableCell className='align-middle'>
                              <Badge
                                className={
                                  u.banned
                                    ? 'border-red-500/30 bg-red-500/20 text-red-600'
                                    : 'border-green-500/30 bg-green-500/20 text-green-600'
                                }
                              >
                                {u.banned ? 'Banned' : 'Active'}
                              </Badge>
                            </TableCell>

                            {/* ✅ Approved */}
                            <TableCell className='align-middle'>
                              <Badge
                                className={
                                  u.approved
                                    ? 'border-green-500/30 bg-green-500/20 text-green-600'
                                    : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-600'
                                }
                              >
                                {u.approved ? 'Yes' : 'Pending'}
                              </Badge>
                            </TableCell>

                            {/* 🗓️ Created */}
                            <TableCell className='align-middle'>
                              {new Date(u.created_at).toLocaleDateString(
                                'en-GB'
                              )}
                            </TableCell>

                            {/* ⏰ Last Sign-In */}
                            <TableCell className='align-middle'>
                              {u.last_sign_in_at
                                ? new Date(
                                    u.last_sign_in_at
                                  ).toLocaleDateString('en-GB')
                                : '—'}
                            </TableCell>

                            {/* ⚙️ Actions */}
                            <TableCell className='text-right align-middle'>
                              <div className='flex items-center justify-end gap-2'>
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
                                <Button
                                  size='sm'
                                  className={`${
                                    u.approved
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-yellow-500 text-black hover:bg-yellow-600'
                                  }`}
                                  onClick={() => approveUser(u.id)}
                                >
                                  {u.approved ? 'Approved' : 'Approve'}
                                </Button>
                                <Button
                                  size='icon'
                                  variant='destructive'
                                  onClick={() => deleteUser(u.id)}
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY TAB mit Delivery Note */}
          <TabsContent value='activity' className='mt-4'>
            <Card>
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
                  <div className='overflow-hidden rounded-md border'>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Article</TableHead>
                          <TableHead className='text-right'>Qty</TableHead>
                          <TableHead>Delivery Note</TableHead>
                          <TableHead>Comment</TableHead>
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
                            <TableCell className='align-middle whitespace-nowrap'>
                              {a.benutzer ? (
                                <div className='flex flex-col leading-tight'>
                                  {/* Prüfen, ob Name + E-Mail getrennt werden können */}
                                  {a.benutzer.includes('(') ? (
                                    <>
                                      <span className='text-foreground font-semibold'>
                                        {a.benutzer.split('(')[0].trim()}
                                      </span>
                                      <span className='text-muted-foreground text-sm'>
                                        (
                                        {a.benutzer
                                          .split('(')[1]
                                          ?.replace(')', '')
                                          .trim()}
                                        )
                                      </span>
                                    </>
                                  ) : (
                                    <span className='text-foreground font-semibold'>
                                      {a.benutzer}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className='text-muted-foreground text-sm'>
                                  —
                                </span>
                              )}
                            </TableCell>
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
                            <TableCell className='text-right'>
                              {a.menge_diff}
                            </TableCell>
                            <TableCell>
                              {a.lieferscheinnr ? (
                                <span className='text-primary font-medium'>
                                  {a.lieferscheinnr}
                                </span>
                              ) : (
                                <span className='text-muted-foreground'>—</span>
                              )}
                            </TableCell>
                            <TableCell>{a.kommentar || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
