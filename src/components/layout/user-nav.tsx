'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { LogOut, User as UserIcon, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function UserNav() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const t = useTranslations('userNav');

  // 🧠 Auth-Status überwachen
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) {
        setAvatarUrl(data.user.user_metadata?.avatar_url || null);
        setFirst(data.user.user_metadata?.first_name || '');
        setLast(data.user.user_metadata?.last_name || '');
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setAvatarUrl(u.user_metadata?.avatar_url || null);
        setFirst(u.user_metadata?.first_name || '');
        setLast(u.user_metadata?.last_name || '');
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  // Kein eingeloggter User → nichts anzeigen
  if (!user) return null;

  // 🔹 Nutzerinformationen vorbereiten
  const firstName = first || user.user_metadata?.first_name || '';
  const lastName = last || user.user_metadata?.last_name || '';
  const displayName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0];

  const email = user.email || '';

  // 🚪 Logout-Funktion
  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
      toast.success(t('signOutSuccess'));
      router.push('/auth/sign-in');
    } catch (err) {
      console.error('❌ Logout failed:', err);
      toast.error(t('signOutError'));
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-11 w-11 rounded-full active:scale-95 focus-visible:ring-0 focus-visible:ring-offset-0 sm:h-9 sm:w-9'
        >
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className='text-xs font-bold'>
              {(firstName?.[0] || 'A') + (lastName?.[0] || 'L')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-60 rounded-2xl p-1.5' align='end' sideOffset={8}>
        {/* 🔹 Benutzerinformationen */}
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>{displayName}</p>
            <p className='text-muted-foreground truncate text-xs leading-none'>
              {email}
            </p>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 🔹 Menüeinträge */}
        <DropdownMenuGroup>
          <DropdownMenuItem className='min-h-[44px] cursor-pointer rounded-xl' onClick={() => router.push('/dashboard/profile')}>
            <UserIcon className='mr-2 h-4 w-4' />
            {t('profile')}
          </DropdownMenuItem>
          <DropdownMenuItem className='min-h-[44px] cursor-pointer rounded-xl' onClick={() => router.push('/dashboard/settings')}>
            <Settings className='mr-2 h-4 w-4' />
            {t('settings')}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* 🔹 Logout */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className='min-h-[44px] cursor-pointer rounded-xl text-red-600 focus:bg-red-50 focus:text-red-700 dark:focus:bg-red-950/30'
        >
          <LogOut className='mr-2 h-4 w-4' />
          {t('logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
