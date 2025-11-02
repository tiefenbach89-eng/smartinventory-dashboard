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

export function UserNav() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');

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
      toast.success('Signed out successfully.');
      router.push('/auth/sign-in');
    } catch (err) {
      console.error('❌ Logout failed:', err);
      toast.error('Logout failed.');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='relative h-8 w-8 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0'
        >
          <Avatar className='h-8 w-8'>
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback>
              {(firstName?.[0] || 'A') + (lastName?.[0] || 'L')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className='w-56' align='end' sideOffset={10}>
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
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
            <UserIcon className='mr-2 h-4 w-4' />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className='mr-2 h-4 w-4' />
            Settings
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* 🔹 Logout */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className='cursor-pointer text-red-600 focus:text-red-700'
        >
          <LogOut className='mr-2 h-4 w-4' />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
