'use client';

import { Input } from '@/components/ui/input';
import { useEffect, useRef, useState } from 'react';
import { FormFileUpload } from '@/components/forms/form-file-upload';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { CardModern } from '@/components/ui/card-modern';
import { Form } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Resolver } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { useTranslations } from 'next-intl';

export default function ProductForm({ initialData, pageTitle }: any) {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('ProductForm');
  const { permissions } = useRolePermissions();

  const canManage = permissions?.can_manage_products;

  // Fullscreen-Scanner-States
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean>(false);

  // Kamera prüfen (für Stop-Cursor + Button)
  useEffect(() => {
    async function checkCamera() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.enumerateDevices
      ) {
        setHasCamera(false);
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        setHasCamera(hasVideo);
      } catch {
        setHasCamera(false);
      }
    }
    checkCamera();
  }, []);

  // Scanner starten, wenn Overlay offen geht
  useEffect(() => {
    if (!scannerOpen) return;

    let cancelled = false;

    async function startScan() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        const result = await reader.decodeOnceFromVideoElement(
          videoRef.current!
        );
        if (cancelled) return;

        const ean = result.getText();
        form.setValue('ean', ean);
        toast.success(t('eanScanned'));
        closeScanner();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(t('eanScanFailed'));
        closeScanner();
      }
    }

    startScan();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [scannerOpen]);

  const closeScanner = () => {
    setScannerOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleScanClick = () => {
    if (!canManage) return;
    if (!hasCamera || !navigator.mediaDevices?.getUserMedia) {
      toast.error(t('noCamera'));
      return;
    }
    setScannerOpen(true);
  };

  const formSchema = z.object({
    artikelnummer: z.coerce.number().min(1, t('errorArticleNumber')),
    name: z.string().min(2, t('errorName')),
    supplier: z.string().min(1, t('errorSupplier')),
    price: z.coerce.number().min(0.01, t('errorPrice')),
    minStock: z.coerce.number().min(1, t('errorMinStock')),
    description: z.string().optional(),
    ean: z
      .string()
      .optional()
      .transform((v) => (v?.trim() === '' ? undefined : v?.trim()))
      .refine((val) => !val || /^[0-9]+$/.test(val), t('errorEanDigits'))
      .refine(
        (val) => !val || val.length === 8 || val.length === 13,
        t('errorEanLength')
      ),
    image: z.custom<File[]>().optional()
  });

  const form = useForm<any>({
    resolver: zodResolver(formSchema) as unknown as Resolver<any>,
    defaultValues: {
      artikelnummer: initialData?.artikelnummer ?? '',
      name: initialData?.name ?? '',
      supplier: initialData?.supplier ?? '',
      price: initialData?.price ?? 0,
      minStock: initialData?.minStock ?? 0,
      description: initialData?.description ?? '',
      ean: initialData?.ean ?? '',
      image: []
    }
  });

  async function onSubmit(values: any) {
    if (!canManage) return toast.error(t('noPermission'));
    try {
      toast.loading(t('saving'));

      let imageUrl = null;
      if (values.image && values.image[0]) {
        const file = values.image[0];
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const payload = {
        artikelnummer: String(values.artikelnummer),
        artikelbezeichnung: values.name,
        beschreibung: values.description || null,
        lieferant: values.supplier,
        preis: values.price,
        sollbestand: values.minStock,
        ean: values.ean || null,
        image_url: imageUrl
      };

      const { error } = await supabase.from('artikel').upsert(payload);
      if (error) throw new Error(error.message);

      toast.success(t('success'));
      router.push('/dashboard/product');
    } catch (err: any) {
      toast.error(t('failed', { message: err.message }));
    } finally {
      toast.dismiss();
    }
  }

  return (
    <div className='w-full px-6 py-10'>
      <CardModern className='w-full space-y-8 p-8'>
        <CardHeader>
          <CardTitle className='text-2xl'>{pageTitle}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit} className='space-y-8'>
            <FormFileUpload
              control={form.control}
              name='image'
              label={t('imageLabel')}
              description={t('imageDescription')}
              config={{ maxFiles: 1 }}
              disabled={!canManage}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='artikelnummer'
                label={t('artikelnummer')}
                type='number'
                required
                disabled={!canManage}
              />
              <FormInput
                control={form.control}
                name='name'
                label={t('name')}
                required
                disabled={!canManage}
              />
              <FormInput
                control={form.control}
                name='supplier'
                label={t('supplier')}
                required
                disabled={!canManage}
              />
              <FormInput
                control={form.control}
                name='price'
                label={t('price')}
                type='number'
                step='0.01'
                required
                disabled={!canManage}
              />
              <FormInput
                control={form.control}
                name='minStock'
                label={t('minStock')}
                type='number'
                required
                disabled={!canManage}
              />
            </div>

            {/* EAN + Scan */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                {t('eanLabel')}
              </label>
              <div className='relative flex items-center'>
                <Input
                  {...form.register('ean')}
                  placeholder={t('eanPlaceholder')}
                  className='pr-16'
                  disabled={!canManage}
                />
                <button
                  type='button'
                  onClick={handleScanClick}
                  disabled={!canManage || !hasCamera}
                  className={[
                    'absolute inset-y-0 right-2 flex items-center pr-2 transition',
                    !canManage || !hasCamera
                      ? 'cursor-not-allowed opacity-30'
                      : 'text-muted-foreground hover:text-foreground cursor-pointer'
                  ].join(' ')}
                  aria-label={t('eanScanButtonLabel')}
                  title={!hasCamera ? t('noCamera') : t('eanScanButtonLabel')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-6 w-6'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M4 5h1v14H4V5Zm15 0h1v14h-1V5ZM7 9h1v6H7V9Zm4 0h1v6h-1V9Zm4 0h1v6h-1V9Z' />
                  </svg>
                </button>
              </div>
            </div>

            <FormTextarea
              control={form.control}
              name='description'
              label={t('descriptionLabel')}
              placeholder={t('descriptionPlaceholder')}
              config={{ rows: 4 }}
              disabled={!canManage}
            />

            <Button
              type='submit'
              className='w-full md:w-auto'
              disabled={!canManage}
            >
              {t(canManage ? 'buttonSave' : 'noPermission')}
            </Button>
          </Form>
        </CardContent>
      </CardModern>

      {/* 🔍 FULLSCREEN SCANNER OVERLAY */}
      {scannerOpen && (
        <div className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 text-white'>
          <button
            onClick={closeScanner}
            className='absolute top-4 right-4 rounded-md bg-white/20 px-3 py-1 text-sm'
            aria-label='Close scanner'
          >
            ✕
          </button>

          <div className='relative w-full max-w-xl px-4'>
            <video
              ref={videoRef}
              className='h-[60vh] w-full rounded-2xl object-cover'
              autoPlay
              muted
              playsInline
            />

            {/* Rahmen */}
            <div className='pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/40' />

            {/* Scan-Linie */}
            <div className='animate-scan absolute top-1/3 right-10 left-10 h-[3px] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]' />
          </div>

          <p className='mt-4 text-sm text-white/80'>{t('scanActiveText')}</p>

          <style>{`
            @keyframes scan {
              0% { transform: translateY(0); }
              50% { transform: translateY(160px); }
              100% { transform: translateY(0); }
            }
            .animate-scan {
              animation: scan 2s ease-in-out infinite;
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
