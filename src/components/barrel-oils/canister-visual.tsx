'use client';

type CanisterVisualProps = {
  currentLevel: number;
  maxCapacity: number;
  canisterSize: number;
  liquidType: 'windshield_washer' | 'distilled_water';
};

export function CanisterVisual({
  currentLevel,
  maxCapacity,
  canisterSize,
  liquidType
}: CanisterVisualProps) {
  const fillPercentage = Math.min(100, (currentLevel / maxCapacity) * 100);

  const getFillColors = () => {
    // Warnung bei niedrigem Füllstand (< 30% wie bei Öl)
    if (fillPercentage < 10) {
      return {
        light: '#fca5a5',
        primary: '#ef4444',
        dark: '#dc2626',
        glow: 'rgba(239, 68, 68, 0.4)'
      };
    }
    if (fillPercentage < 20) {
      return {
        light: '#fdba74',
        primary: '#f97316',
        dark: '#ea580c',
        glow: 'rgba(249, 115, 22, 0.4)'
      };
    }
    if (fillPercentage < 30) {
      return {
        light: '#fcd34d',
        primary: '#f59e0b',
        dark: '#d97706',
        glow: 'rgba(245, 158, 11, 0.4)'
      };
    }

    // Normale Farben ab 30%
    if (liquidType === 'windshield_washer') {
      return {
        light: '#60a5fa',
        primary: '#3b82f6',
        dark: '#2563eb',
        glow: 'rgba(59, 130, 246, 0.4)'
      };
    }
    // distilled_water
    return {
      light: '#67e8f9',
      primary: '#06b6d4',
      dark: '#0891b2',
      glow: 'rgba(6, 182, 212, 0.4)'
    };
  };

  const colors = getFillColors();

  return (
    <div className='relative mx-auto w-full max-w-[140px] touch-none select-none'>
      {/* Enhanced Glow Effect */}
      <div
        className='absolute inset-0 -z-10 blur-2xl opacity-20 transition-all duration-1000'
        style={{
          background: `radial-gradient(circle at center, ${colors.glow} 0%, ${colors.glow} 20%, transparent 70%)`
        }}
      />

      {/* SVG Wasserkanister - Rechteckiger Kanister */}
      <svg
        viewBox='0 0 200 300'
        className='w-full drop-shadow-2xl'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          {/* White Plastic Kanister Material */}
          <linearGradient id='canisterPlastic' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#e8e8e8' />
            <stop offset='15%' stopColor='#ffffff' />
            <stop offset='50%' stopColor='#f5f5f5' />
            <stop offset='85%' stopColor='#ffffff' />
            <stop offset='100%' stopColor='#e0e0e0' />
          </linearGradient>

          {/* Kanister Gloss */}
          <linearGradient id='canisterGloss' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='white' stopOpacity='0.9' />
            <stop offset='30%' stopColor='white' stopOpacity='0.5' />
            <stop offset='100%' stopColor='white' stopOpacity='0.1' />
          </linearGradient>

          {/* Fill Gradient */}
          <linearGradient id={`bottleFill-${fillPercentage}`} x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor={colors.light} stopOpacity='0.85' />
            <stop offset='50%' stopColor={colors.primary} stopOpacity='0.9' />
            <stop offset='100%' stopColor={colors.dark} stopOpacity='0.95' />
          </linearGradient>

          {/* Liquid Shine */}
          <radialGradient id='bottleShine'>
            <stop offset='0%' stopColor='white' stopOpacity='0.6' />
            <stop offset='50%' stopColor='white' stopOpacity='0.2' />
            <stop offset='100%' stopColor='white' stopOpacity='0' />
          </radialGradient>

          {/* Clip Path für Kanister */}
          <clipPath id='canisterClip'>
            <rect x='50' y='80' width='100' height='180' rx='5' />
          </clipPath>
        </defs>

        {/* Shadow */}
        <ellipse
          cx='100'
          cy='275'
          rx='55'
          ry='8'
          fill='#000000'
          opacity='0.2'
          filter='blur(6px)'
        />

        {/* Kanister Hauptkörper - breiter und massiver */}
        <rect
          x='50'
          y='80'
          width='100'
          height='180'
          rx='5'
          fill='url(#canisterPlastic)'
          stroke='#c0c0c0'
          strokeWidth='2.5'
          opacity='1'
        />

        {/* Gloss Overlay - breiter für Kanister */}
        <rect
          x='55'
          y='85'
          width='35'
          height='170'
          rx='4'
          fill='url(#canisterGloss)'
          opacity='0.7'
        />

        {/* Füllstand im Kanister */}
        <g clipPath='url(#canisterClip)'>
          <rect
            x='50'
            y={260 - (fillPercentage * 1.8)}
            width='100'
            height={fillPercentage * 1.8}
            fill={`url(#bottleFill-${fillPercentage})`}
            className='transition-all duration-1000'
          />

          {/* Liquid Surface Wave */}
          <path
            d={`M 50 ${260 - (fillPercentage * 1.8)}
                Q 75 ${260 - (fillPercentage * 1.8) - 2}, 100 ${260 - (fillPercentage * 1.8)}
                T 150 ${260 - (fillPercentage * 1.8)}`}
            fill={colors.light}
            opacity='0.5'
          >
            <animate
              attributeName='d'
              values={`M 50 ${260 - (fillPercentage * 1.8)} Q 75 ${260 - (fillPercentage * 1.8) - 2}, 100 ${260 - (fillPercentage * 1.8)} T 150 ${260 - (fillPercentage * 1.8)};
                      M 50 ${260 - (fillPercentage * 1.8)} Q 75 ${260 - (fillPercentage * 1.8) + 2}, 100 ${260 - (fillPercentage * 1.8)} T 150 ${260 - (fillPercentage * 1.8)};
                      M 50 ${260 - (fillPercentage * 1.8)} Q 75 ${260 - (fillPercentage * 1.8) - 2}, 100 ${260 - (fillPercentage * 1.8)} T 150 ${260 - (fillPercentage * 1.8)}`}
              dur='3s'
              repeatCount='indefinite'
            />
          </path>

          {/* Shine Effect */}
          {fillPercentage > 10 && (
            <ellipse
              cx='90'
              cy={220 - (fillPercentage * 1.8)}
              rx='25'
              ry='15'
              fill='url(#bottleShine)'
              className='transition-all duration-1000'
            >
              <animate
                attributeName='opacity'
                values='0.4; 0.7; 0.4'
                dur='3s'
                repeatCount='indefinite'
              />
            </ellipse>
          )}
        </g>

        {/* Kanister Hals - schmal oben */}
        <rect
          x='75'
          y='55'
          width='50'
          height='30'
          rx='3'
          fill='url(#canisterPlastic)'
          stroke='#c0c0c0'
          strokeWidth='2.5'
        />

        {/* Verschluss / Schraubdeckel (weiß/grau) */}
        <rect
          x='80'
          y='35'
          width='40'
          height='25'
          rx='4'
          fill='#d0d0d0'
          stroke='#a0a0a0'
          strokeWidth='2'
        />
        <rect
          x='83'
          y='38'
          width='34'
          height='19'
          rx='3'
          fill='#e8e8e8'
        />
        {/* Deckel Rillen */}
        <line x1='85' y1='42' x2='115' y2='42' stroke='#c0c0c0' strokeWidth='1.5' />
        <line x1='85' y1='47' x2='115' y2='47' stroke='#c0c0c0' strokeWidth='1.5' />
        <line x1='85' y1='52' x2='115' y2='52' stroke='#c0c0c0' strokeWidth='1.5' />

        {/* Edge Highlights für 3D-Effekt */}
        <line
          x1='55'
          y1='85'
          x2='55'
          y2='255'
          stroke='white'
          strokeWidth='2.5'
          opacity='0.4'
          strokeLinecap='round'
        />
        <line
          x1='145'
          y1='85'
          x2='145'
          y2='255'
          stroke='#a0a0a0'
          strokeWidth='1.5'
          opacity='0.3'
          strokeLinecap='round'
        />
      </svg>

      {/* Percentage Display */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <p
          className='text-2xl font-black tracking-tight transition-all duration-500 mt-4'
          style={{
            color: colors.dark,
            textShadow: `0 2px 8px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.8)`
          }}
        >
          {fillPercentage.toFixed(0)}%
        </p>
      </div>

      {/* Volume Display */}
      <div className='mt-2 text-center'>
        <div className='flex items-center justify-center gap-1.5 mb-1'>
          <span className='text-sm font-black' style={{ color: colors.primary }}>
            {currentLevel.toFixed(1)} L
          </span>
          <span className='text-muted-foreground text-xs font-bold opacity-60'>
            / {maxCapacity} L
          </span>
        </div>
        <div className='mx-auto inline-flex rounded-lg bg-gradient-to-r from-secondary/40 to-secondary/20 px-2.5 py-0.5 shadow-sm'>
          <p className='text-muted-foreground text-[10px] font-bold uppercase tracking-wide'>
            {canisterSize}L Kanister
          </p>
        </div>
      </div>
    </div>
  );
}
