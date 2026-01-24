'use client';

import { useEffect, useState } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const supabase = createClient();
  const t = useTranslations('Profile');

  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
        error
      } = await supabase.auth.getUser();
      if (error || !user) {
        setLoading(false);
        return;
      }
      setEmail(user.email || '');
      setFirstName(user.user_metadata?.first_name || '');
      setLastName(user.user_metadata?.last_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
      setLoading(false);
    }
    loadProfile();
  }, [supabase]);

  async function handleSave() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: firstName,
          last_name: lastName,
          avatar_url: avatarUrl || null
        }
      });
      if (error) throw error;
      toast.success(t('toastUpdated'));
    } catch (err: any) {
      toast.error(t('toastError', { message: err.message || '' }));
    } finally {
      setLoading(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);

      const fileName = `avatar-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('profile-avatars')
        .upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('profile-avatars')
        .getPublicUrl(fileName);
      setAvatarUrl(data.publicUrl);
      toast.success(t('toastAvatarUploaded'));
    } catch (err: any) {
      toast.error(t('toastError', { message: err.message || '' }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='flex justify-center overflow-y-auto px-4 py-10 sm:px-6 lg:px-8'>
      <CardModern className='w-full max-w-2xl space-y-8 p-6 shadow-md sm:p-8'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold'>{t('title')}</CardTitle>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent className='space-y-8'>
          {/* 🖼️ Avatar */}
          <div className='flex flex-col items-center gap-3'>
            <Avatar className='border-primary/40 h-32 w-32 border-2 shadow-lg'>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className='text-lg font-semibold'>
                {firstName?.[0] || 'A'}
                {lastName?.[0] || 'L'}
              </AvatarFallback>
            </Avatar>
            <label className='text-primary flex cursor-pointer items-center gap-2 text-sm font-medium hover:underline'>
              <Upload className='h-4 w-4' />
              {t('changeImage')}
              <input
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          {/* 🧾 Profile Fields */}
          <div className='space-y-6'>
            <div>
              <Label>{t('emailLabel')}</Label>
              <Input
                value={email}
                disabled
                className='bg-muted/20 text-muted-foreground mt-2'
              />
            </div>

            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
              <div>
                <Label>{t('firstNameLabel')}</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className='mt-2'
                />
              </div>
              <div>
                <Label>{t('lastNameLabel')}</Label>
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className='mt-2'
                />
              </div>
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={handleSave}
              disabled={loading || uploading}
              className='bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors'
            >
              {loading ? t('saving') : t('save')}
            </Button>
          </div>
        </CardContent>
      </CardModern>
    </div>
  );
}
