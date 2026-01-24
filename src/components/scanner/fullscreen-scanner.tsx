'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export default function FullscreenScanner({
  open,
  onClose,
  onResult
}: {
  open: boolean;
  onClose: () => void;
  onResult: (ean: string) => void;
}) {
  const t = useTranslations('ProductForm');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  // Kamera starten
  useEffect(() => {
    if (!open) return;
    setReady(false);

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setReady(true);

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        const result = await reader.decodeOnceFromVideoElement(
          videoRef.current!
        );

        stopCamera();
        onResult(result.getText());
      } catch (err) {
        stopCamera();
        toast.error(t('eanScanFailed'));
      }
    }

    start();

    return () => stopCamera();
  }, [open]);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  if (!open) return null;

  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex touch-none flex-col items-center justify-center bg-black/90 text-white'
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Close */}
      <button
        onClick={() => {
          stopCamera();
          onClose();
        }}
        className='absolute top-4 right-4 rounded-md bg-white/20 px-3 py-1 text-sm'
      >
        ✕ {t('cancel') ?? 'Abbrechen'}
      </button>

      {/* Video */}
      <div className='relative w-full max-w-xl'>
        <video
          ref={videoRef}
          className='h-[60vh] w-full rounded-lg object-cover'
          autoPlay
          muted
          playsInline
        />

        {/* Rahmen */}
        <div className='pointer-events-none absolute inset-4 rounded-xl border-2 border-white/40'></div>

        {/* Scan-Linie */}
        {ready && (
          <div className='animate-scan absolute right-4 left-4 h-[3px] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]' />
        )}
      </div>

      <p className='mt-4 text-sm text-white/70'>{t('scanActiveText')}</p>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(260px); }
          100% { transform: translateY(0); }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>,
    document.body
  );
}
