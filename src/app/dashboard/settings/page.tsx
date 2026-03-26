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

// 🌍 next-intl
import { useTranslations } from 'next-intl';

export default function SettingsPage() {
  const supabase = createClient();
  const t = useTranslations('Settings');

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

  // 🔁 Automatisches Neuladen der Userdaten via Auth-State-Listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.email) setEmail(session.user.email);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  // 🔐 Passwort ändern
  async function handlePasswordChange() {
    if (password !== confirm) {
      toast.error(t('passwordsDontMatch'));
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success(t('passwordUpdated'));
      setPassword('');
      setConfirm('');
    } catch (err: any) {
      toast.error(t('genericError', { message: err.message || '' }));
    } finally {
      setLoading(false);
    }
  }

  // ✉️ E-Mail ändern
  async function handleEmailChange() {
    if (!newEmail) return;
    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;

      toast.message(t('emailChangeTitle'), {
        description: t('emailChangeDescription'),
        duration: 5000
      });

      setNewEmail('');
    } catch (err: any) {
      toast.error(t('emailUpdateFailedTitle'), {
        description: t('emailUpdateFailedDescription', {
          message: err.message || t('unknownError')
        })
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
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || 'Failed to delete account');
      toast.success(t('accountDeleted'));
      window.location.href = '/auth/sign-in';
    } catch (err: any) {
      toast.error(t('deleteFailed', { message: err.message || '' }));
    } finally {
      setDeleting(false);
    }
  }

  // ⬇️ Render
  return (
    <div className='flex justify-center px-4 py-8 sm:px-6 sm:py-10 md:px-10 lg:px-12'>
      <CardModern className='w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 p-6 shadow-sm sm:p-8 dark:border-border/40'>
        <CardHeader>
          <CardTitle className='text-xl font-bold'>{t('title')}</CardTitle>
          <CardDescription className='mt-1 text-sm text-muted-foreground'>
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-10'>
          {/* 🔐 Password */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold'>
              {t('sectionPasswordTitle')}
            </h3>
            <div className='grid gap-4'>
              <div>
                <Label>{t('newPasswordLabel')}</Label>
                <Input
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='mt-2'
                />
              </div>
              <div>
                <Label>{t('confirmPasswordLabel')}</Label>
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
              {loading ? t('passwordUpdating') : t('passwordUpdateButton')}
            </Button>
          </section>

          {/* ✉️ Email */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold'>{t('sectionEmailTitle')}</h3>
            <p className='text-muted-foreground text-sm'>
              {t('currentEmail')} <span className='font-medium'>{email}</span>
            </p>
            <div>
              <Label>{t('newEmailLabel')}</Label>
              <Input
                type='email'
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('newEmailPlaceholder')}
                className='mt-2'
              />
            </div>
            <Button
              onClick={handleEmailChange}
              disabled={loading || !newEmail}
              variant='secondary'
              className='w-full transition-colors sm:w-auto'
            >
              {loading ? t('emailUpdating') : t('emailUpdateButton')}
            </Button>
          </section>

          {/* 🗑️ Delete */}
          <section className='border-border/40 space-y-4 border-t pt-6'>
            <h3 className='text-lg font-semibold text-red-500'>
              {t('sectionDeleteTitle')}
            </h3>
            <p className='text-muted-foreground text-sm'>
              {t('sectionDeleteDescription')}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='destructive'
                  disabled={deleting}
                  className='w-full transition-colors sm:w-auto'
                >
                  {t('deleteButton')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('dialogDeleteTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('dialogDeleteDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('dialogCancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                  >
                    {deleting ? t('deleting') : t('dialogConfirmDelete')}
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
