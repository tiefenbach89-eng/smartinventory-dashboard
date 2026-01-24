'use client';

interface BarrelVisualProps {
  currentLevel: number;
  maxCapacity: number;
  barrelSize: number;
}

export function BarrelVisual({ currentLevel, maxCapacity, barrelSize }: BarrelVisualProps) {
  const fillPercentage = (currentLevel / maxCapacity) * 100;

  // Moderne Farben basierend auf Füllstand
  const getFillColors = () => {
    if (fillPercentage < 20) return {
      primary: '#ef4444',
      light: '#fca5a5',
      dark: '#dc2626',
      glow: 'rgba(239, 68, 68, 0.4)'
    };
    if (fillPercentage < 50) return {
      primary: '#f59e0b',
      light: '#fcd34d',
      dark: '#d97706',
      glow: 'rgba(245, 158, 11, 0.4)'
    };
    return {
      primary: '#10b981',
      light: '#6ee7b7',
      dark: '#059669',
      glow: 'rgba(16, 185, 129, 0.4)'
    };
  };

  const colors = getFillColors();

  return (
    <div className='relative mx-auto w-full max-w-[140px] touch-none select-none'>
      {/* Enhanced Glow Effect for iOS - dezenter */}
      <div
        className='absolute inset-0 -z-10 blur-2xl opacity-20 transition-all duration-1000'
        style={{
          background: `radial-gradient(circle at center, ${colors.glow} 0%, ${colors.glow} 20%, transparent 70%)`
        }}
      />

      {/* SVG Ölfass */}
      <svg
        viewBox='0 0 220 300'
        className='w-full drop-shadow-2xl'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          {/* Apple-Style Premium Metallic Gradient */}
          <linearGradient id='barrelMetallic' x1='0%' y1='0%' x2='100%' y2='0%'>
            <stop offset='0%' stopColor='#0f172a' />
            <stop offset='15%' stopColor='#1e293b' />
            <stop offset='30%' stopColor='#334155' />
            <stop offset='50%' stopColor='#64748b' />
            <stop offset='70%' stopColor='#334155' />
            <stop offset='85%' stopColor='#1e293b' />
            <stop offset='100%' stopColor='#0f172a' />
          </linearGradient>

          {/* Premium Gloss Gradient */}
          <linearGradient id='barrelGloss' x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='white' stopOpacity='0.4' />
            <stop offset='50%' stopColor='white' stopOpacity='0.1' />
            <stop offset='100%' stopColor='white' stopOpacity='0' />
          </linearGradient>

          {/* Glassmorphism Fill Gradient - Apple Style */}
          <linearGradient id={`modernFill-${fillPercentage}`} x1='0%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor={colors.light} stopOpacity='1' />
            <stop offset='40%' stopColor={colors.primary} stopOpacity='0.95' />
            <stop offset='100%' stopColor={colors.dark} stopOpacity='0.9' />
          </linearGradient>

          {/* Liquid Shine Effect */}
          <radialGradient id='liquidShine'>
            <stop offset='0%' stopColor='white' stopOpacity='0.8' />
            <stop offset='40%' stopColor='white' stopOpacity='0.3' />
            <stop offset='100%' stopColor='white' stopOpacity='0' />
          </radialGradient>

          {/* Premium Shadow Filter */}
          <filter id='premiumShadow'>
            <feGaussianBlur in='SourceAlpha' stdDeviation='4'/>
            <feOffset dx='0' dy='4' result='offsetblur'/>
            <feComponentTransfer>
              <feFuncA type='linear' slope='0.6'/>
            </feComponentTransfer>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in='SourceGraphic'/>
            </feMerge>
          </filter>

          {/* 3D Depth Effect */}
          <filter id='depth3D'>
            <feGaussianBlur in='SourceAlpha' stdDeviation='2'/>
            <feOffset dx='-2' dy='2' result='offsetblur'/>
            <feFlood floodColor='#000000' floodOpacity='0.3'/>
            <feComposite in2='offsetblur' operator='in'/>
            <feMerge>
              <feMergeNode/>
              <feMergeNode in='SourceGraphic'/>
            </feMerge>
          </filter>

          {/* Clip Path für Füllstand */}
          <clipPath id='barrelClip2026'>
            <path
              d='M 55 30
                 Q 55 20, 65 20
                 L 155 20
                 Q 165 20, 165 30
                 L 170 270
                 Q 170 280, 160 280
                 L 60 280
                 Q 50 280, 50 270
                 Z'
            />
          </clipPath>
        </defs>

        {/* Fass-Schatten (unter dem Fass) */}
        <ellipse
          cx='110'
          cy='285'
          rx='55'
          ry='8'
          fill='#000000'
          opacity='0.2'
          filter='blur(4px)'
        />

        {/* Hauptkörper des Fasses - Apple Premium Style */}
        <path
          d='M 55 30
             Q 55 20, 65 20
             L 155 20
             Q 165 20, 165 30
             L 170 270
             Q 170 280, 160 280
             L 60 280
             Q 50 280, 50 270
             Z'
          fill='url(#barrelMetallic)'
          stroke='#000000'
          strokeWidth='2'
          filter='url(#premiumShadow)'
        />

        {/* Premium Gloss Overlay */}
        <path
          d='M 60 25
             Q 60 22, 65 22
             L 100 22
             Q 105 22, 105 25
             L 105 275
             Q 105 278, 100 278
             L 65 278
             Q 60 278, 60 275
             Z'
          fill='url(#barrelGloss)'
          opacity='0.6'
        />

        {/* Apple-Style Premium Metallringe */}
        <g filter='url(#depth3D)'>
          {/* Oberer Ring - 3D Effect */}
          <rect x='50' y='25' width='120' height='8' fill='#0a0f1a' rx='4' />
          <rect x='50' y='25' width='120' height='4' fill='url(#barrelMetallic)' rx='2' />
          <rect x='52' y='26' width='116' height='1' fill='white' opacity='0.3' rx='0.5' />

          {/* Mittlerer Ring - 3D Effect */}
          <rect x='48' y='144' width='124' height='10' fill='#0a0f1a' rx='5' />
          <rect x='48' y='144' width='124' height='5' fill='url(#barrelMetallic)' rx='2.5' />
          <rect x='50' y='145' width='120' height='2' fill='white' opacity='0.3' rx='1' />

          {/* Unterer Ring - 3D Effect */}
          <rect x='50' y='265' width='120' height='8' fill='#0a0f1a' rx='4' />
          <rect x='50' y='265' width='120' height='4' fill='url(#barrelMetallic)' rx='2' />
          <rect x='52' y='266' width='116' height='1' fill='white' opacity='0.3' rx='0.5' />
        </g>

        {/* Füllstand mit Animationen */}
        <g clipPath='url(#barrelClip2026)'>
          {/* Haupt-Füllstand */}
          <rect
            x='50'
            y={280 - (fillPercentage * 2.6)}
            width='120'
            height={fillPercentage * 2.6}
            fill={`url(#modernFill-${fillPercentage})`}
            className='transition-all duration-1000 ease-out'
            opacity='0.95'
          />

          {/* Animierte Welleneffekte */}
          <path
            d={`M 50 ${280 - (fillPercentage * 2.6)}
                Q 75 ${277 - (fillPercentage * 2.6)}, 110 ${280 - (fillPercentage * 2.6)}
                Q 145 ${283 - (fillPercentage * 2.6)}, 170 ${280 - (fillPercentage * 2.6)}
                L 170 280 L 50 280 Z`}
            fill={colors.primary}
            opacity='0.4'
            className='transition-all duration-1000 ease-out'
          >
            <animateTransform
              attributeName='transform'
              type='translate'
              values='0 0; 0 -4; 0 0'
              dur='2.5s'
              repeatCount='indefinite'
            />
          </path>

          {/* Zweite Wellenebene */}
          <path
            d={`M 50 ${280 - (fillPercentage * 2.6)}
                Q 85 ${282 - (fillPercentage * 2.6)}, 110 ${280 - (fillPercentage * 2.6)}
                Q 135 ${278 - (fillPercentage * 2.6)}, 170 ${280 - (fillPercentage * 2.6)}
                L 170 280 L 50 280 Z`}
            fill={colors.light}
            opacity='0.3'
            className='transition-all duration-1000 ease-out'
          >
            <animateTransform
              attributeName='transform'
              type='translate'
              values='0 0; 0 -5; 0 0'
              dur='3s'
              repeatCount='indefinite'
            />
          </path>

          {/* Apple-Style Liquid Shine Effect */}
          {fillPercentage > 10 && (
            <>
              <ellipse
                cx='95'
                cy={250 - (fillPercentage * 2.6)}
                rx='35'
                ry='18'
                fill='url(#liquidShine)'
                className='transition-all duration-1000'
              >
                <animate
                  attributeName='opacity'
                  values='0.4; 0.8; 0.4'
                  dur='3s'
                  repeatCount='indefinite'
                />
              </ellipse>
              <ellipse
                cx='125'
                cy={255 - (fillPercentage * 2.6)}
                rx='25'
                ry='12'
                fill='url(#liquidShine)'
                className='transition-all duration-1000'
                opacity='0.5'
              >
                <animate
                  attributeName='opacity'
                  values='0.3; 0.6; 0.3'
                  dur='3.5s'
                  repeatCount='indefinite'
                />
              </ellipse>
            </>
          )}
        </g>

        {/* Apple-Style Premium Deckel */}
        <g filter='url(#premiumShadow)'>
          {/* Deckel Schatten */}
          <ellipse
            cx='110'
            cy='33'
            rx='56'
            ry='11'
            fill='#000000'
            opacity='0.4'
          />

          {/* Hauptdeckel - Premium Metallic */}
          <ellipse
            cx='110'
            cy='30'
            rx='56'
            ry='11'
            fill='url(#barrelMetallic)'
            stroke='#000000'
            strokeWidth='1.5'
          />

          {/* 3D Tiefe */}
          <ellipse
            cx='110'
            cy='29'
            rx='52'
            ry='9'
            fill='#1e293b'
          />

          {/* Premium Gloss */}
          <ellipse
            cx='110'
            cy='27'
            rx='48'
            ry='7'
            fill='url(#barrelGloss)'
            opacity='0.5'
          />

          {/* Innerer Ring */}
          <ellipse
            cx='110'
            cy='28'
            rx='44'
            ry='6'
            fill='#334155'
            stroke='#1e293b'
            strokeWidth='1'
          />

          {/* Verschluss-Kappe - Apple Style */}
          <circle
            cx='110'
            cy='28'
            r='14'
            fill='#0a0f1a'
            stroke='#000000'
            strokeWidth='1'
          />
          <circle
            cx='110'
            cy='28'
            r='11'
            fill='url(#barrelMetallic)'
          />
          <circle
            cx='110'
            cy='27'
            r='9'
            fill='#334155'
          />
          <circle
            cx='109'
            cy='26'
            r='6'
            fill='url(#barrelGloss)'
            opacity='0.4'
          />
          <circle
            cx='110'
            cy='28'
            r='5'
            fill='#0f172a'
          />
        </g>

        {/* Apple-Style Edge Highlights */}
        <path
          d='M 58 28 L 58 272 Q 58 276, 62 276'
          stroke='white'
          strokeWidth='3'
          opacity='0.15'
          fill='none'
          strokeLinecap='round'
        />
        <path
          d='M 62 24 L 62 274 Q 62 278, 66 278'
          stroke='white'
          strokeWidth='1.5'
          opacity='0.25'
          fill='none'
          strokeLinecap='round'
        />

        {/* Right side subtle shadow */}
        <path
          d='M 162 28 L 162 272 Q 162 276, 158 276'
          stroke='black'
          strokeWidth='2'
          opacity='0.15'
          fill='none'
          strokeLinecap='round'
        />
      </svg>

      {/* iOS-Style Percentage Display - nur Text */}
      <div className='absolute inset-0 flex items-center justify-center'>
        <p
          className='text-2xl font-black tracking-tight transition-all duration-500 mt-8'
          style={{
            color: '#1e293b',
            textShadow: `0 2px 8px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.8), 0 1px 2px rgba(0,0,0,0.3)`
          }}
        >
          {fillPercentage.toFixed(0)}%
        </p>
      </div>

      {/* iOS-Style Volume Display - kompakter */}
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
            {barrelSize}L Fass
          </p>
        </div>
      </div>
    </div>
  );
}
