'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { CardModern } from '@/components/ui/card-modern';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
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

export default function SettingsPage() {
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // 🔹 Initiales Laden der Userdaten
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }
    loadUser();
  }, [supabase]);

  // 🔁 Automatisches Neuladen der Userdaten (Option 6)
  useEffect(() => {
    const interval = setInterval(async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (user?.email) setEmail(user.email);
    }, 10000); // alle 10 Sekunden prüfen
    return () => clearInterval(interval);
  }, [supabase]);

  // 🔐 Passwort ändern
  async function handlePasswordChange() {
    if (password !== confirm) {
      toast.error('Passwords do not match.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success('✅ Password updated.');
      setPassword('');
      setConfirm('');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // ✉️ E-Mail ändern – Supabase nutzt eigene Bestätigungsseite
  async function handleEmailChange() {
    if (!newEmail) return;
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast.message('Confirmation email sent', {
        description:
          '📩 Please check your new inbox and confirm the email change via the Supabase confirmation page.',
        duration: 5000
      });

      setNewEmail('');
    } catch (err: any) {
      toast.error('❌ Failed to update email', {
        description: err.message || 'An unknown error occurred.'
      });
    } finally {
      setLoading(false);
    }
  }

  // 🗑️ Account löschen
  async function handleDeleteAccount() {
    try {
      setDeleting(true);
      const res = await fetch('/api/delete-user', { method: 'POST' });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || 'Failed to delete account');
      toast.success('🗑️ Account deleted.');
      window.location.href = '/auth/sign-in';
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    } finally {
      setDeleting(false);
    }
  }

  // ⬇️ Render
  return (
    <div className='flex justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:px-8'>
      <CardModern className='w-full max-w-2xl space-y-8 p-6 shadow-md sm:p-8'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold'>
            Account Settings
          </CardTitle>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            Manage your credentials and privacy.
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-10'>
          {/* 🔐 Password */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold'>Change Password</h3>
            <div className='grid gap-4'>
              <div>
                <Label>New Password</Label>
                <Input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='mt-2'
                />
              </div>
              <div>
                <Label>Confirm Password</Label>
                <Input
                  type='password'
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className='mt-2'
                />
              </div>
            </div>
            <Button
              onClick={handlePasswordChange}
              disabled={loading || !password || !confirm}
              className='bg-primary text-primary-foreground hover:bg-primary/90 w-full font-semibold transition-colors sm:w-auto'
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </section>

          {/* ✉️ Email */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold'>Change Email</h3>
            <p className='text-muted-foreground text-sm'>
              Current: <span className='font-medium'>{email}</span>
            </p>
            <div>
              <Label>New Email Address</Label>
              <Input
                type='email'
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder='you@domain.com'
                className='mt-2'
              />
            </div>
            <Button
              onClick={handleEmailChange}
              disabled={loading || !newEmail}
              variant='secondary'
              className='w-full transition-colors sm:w-auto'
            >
              {loading ? 'Updating...' : 'Update Email'}
            </Button>
          </section>

          {/* 🗑️ Delete */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold text-red-500'>
              Delete Account
            </h3>
            <p className='text-muted-foreground text-sm'>
              Permanently remove your account and data. This action cannot be
              undone.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  disabled={deleting}
                  className='w-full transition-colors sm:w-auto'
                >
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. Your account and data will be
                    permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting...' : 'Yes, delete account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </section>
        </CardContent>
      </CardModern>
    </div>
  );
}
