'use client';

import { Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function EanInput({ value, onChange, placeholder }: Props) {
  return (
    <div className='relative'>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className='pr-10'
      />

      {/* Icon inside field */}
      <button
        type='button'
        className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center pr-3'
        onClick={() => console.log('SCAN START (coming soon)')}
      >
        <Camera className='h-5 w-5' />
      </button>
    </div>
  );
}
