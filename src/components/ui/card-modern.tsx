'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// Dynamische Farbverläufe nach Theme (die Classnames kommen aus Tailwind)
// Du kannst jederzeit weitere Themes hinzufügen
const themeGradients: Record<string, string> = {
  blue: 'from-blue-500/20 via-blue-950/40 to-background/60',
  amber: 'from-amber-500/20 via-amber-950/40 to-background/60',
  emerald: 'from-emerald-500/20 via-emerald-950/40 to-background/60',
  violet: 'from-violet-500/20 via-violet-950/40 to-background/60',
  rose: 'from-rose-500/20 via-rose-950/40 to-background/60',
  neutral: 'from-primary/10 via-card/80 to-background/40' // fallback
};

export function CardModern({
  className,
  children,
  as: Component = 'div',
  theme = 'neutral'
}: React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  theme?: keyof typeof themeGradients;
}) {
  const gradient = themeGradients[theme] || themeGradients.neutral;

  return (
    <Component
      className={cn(
        // 🧱 Struktur & Padding
        'border-border/40 rounded-2xl border p-8 shadow-md backdrop-blur-sm',
        // 🎨 Dynamischer, leicht transparenter Gradient nach Theme
        `bg-gradient-to-b ${gradient}`,
        // ✨ Sanfter Hover, kein Jump, kein Transform
        'hover:border-primary/40 hover:shadow-primary/10 transition-colors duration-300 hover:shadow-lg',
        'scale-100 transform-none hover:scale-100 hover:transform-none',
        className
      )}
    >
      {children}
    </Component>
  );
}
