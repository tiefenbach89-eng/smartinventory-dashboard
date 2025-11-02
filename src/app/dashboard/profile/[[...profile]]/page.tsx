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
import { toast } from 'sonner';

export default function ProfilePage() {
  const supabase = createClient();
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
      toast.success('✅ Profile updated');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
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
      toast.success('🖼️ Profile picture uploaded');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className='mx-auto max-w-2xl py-10'>
      <CardModern className='transform-none space-y-6 p-8 transition-none hover:scale-100 hover:transform-none hover:shadow-md'>
        <CardHeader className='flex flex-col pb-6 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <CardTitle className='text-2xl font-semibold'>Profile</CardTitle>
            <CardDescription className='text-muted-foreground mt-1 text-sm'>
              Manage your personal details and avatar.
            </CardDescription>
          </div>
          <div className='mt-5 sm:mt-0'>
            <Avatar className='border-primary/60 h-20 w-20 border-2 shadow'>
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback>
                {firstName?.[0] || 'A'}
                {lastName?.[0] || 'L'}
              </AvatarFallback>
            </Avatar>
          </div>
        </CardHeader>

        <CardContent className='mt-2 space-y-6'>
          <div>
            <Label>Email</Label>
            <Input
              value={email}
              disabled
              className='bg-muted/20 text-muted-foreground mt-2'
            />
          </div>

          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div>
              <Label>First Name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className='mt-2'
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className='mt-2'
              />
            </div>
          </div>

          <div>
            <Label>Profile Picture</Label>
            <Input
              type='file'
              accept='image/*'
              onChange={handleAvatarChange}
              className='mt-2'
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={loading || uploading}
            className='bg-primary text-primary-foreground hover:bg-primary/90 mt-4 w-full font-semibold transition-colors sm:w-auto'
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </CardModern>
    </div>
  );
}
