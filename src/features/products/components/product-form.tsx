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

  // Camera + Scanner
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    if (!navigator.mediaDevices) return setHasCamera(false);
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setHasCamera(devices.some((d) => d.kind === 'videoinput'));
    });
  }, []);

  async function startEANScan() {
    if (!canManage) return;
    try {
      if (!hasCamera) return toast.error(t('noCamera'));

      setIsScanning(true);

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

      const result = await reader.decodeOnceFromVideoElement(videoRef.current!);

      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      setIsScanning(false);
      form.setValue('ean', result.getText());
      toast.success(t('eanScanned'));
    } catch {
      setIsScanning(false);
      toast.error(t('eanScanFailed'));
    }
  }

  // ----------- VALIDATION ----------------
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

  // ----------- SUBMIT ----------------
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

            {/* ---- EAN Input + Scan ---- */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                {t('eanLabel')}
              </label>

              <div className='relative flex items-center'>
                <Input
                  {...form.register('ean')}
                  placeholder={t('eanPlaceholder')}
                  className='pr-20'
                  disabled={!canManage}
                />

                {/* Scan Button */}
                <button
                  type='button'
                  onClick={startEANScan}
                  disabled={!canManage || !hasCamera || isScanning}
                  title={
                    !canManage
                      ? t('noPermission')
                      : !hasCamera
                        ? t('noCamera')
                        : t('scanTooltip')
                  }
                  className={[
                    'absolute inset-y-0 right-2 flex h-full w-10 items-center justify-center rounded-md transition',
                    !canManage
                      ? 'cursor-not-allowed opacity-30'
                      : !hasCamera
                        ? 'cursor-not-allowed opacity-30'
                        : 'hover:bg-muted cursor-pointer'
                  ].join(' ')}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-6 w-6 opacity-70'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M4 5h1v14H4V5Zm15 0h1v14h-1V5ZM7 9h1v6H7V9Zm4 0h1v6h-1V9Zm4 0h1v6h-1V9Z' />
                  </svg>
                </button>
              </div>
            </div>

            {/* ---- Live Scanner ---- */}
            {isScanning && (
              <div className='relative mt-4 overflow-hidden rounded-md border p-2'>
                <video
                  ref={videoRef}
                  className='h-48 w-full rounded-md object-cover'
                  autoPlay
                  muted
                  playsInline
                />

                {/* animated scan line */}
                <div className='animate-scan absolute top-0 left-0 h-[2px] w-full bg-emerald-400 shadow-lg' />

                <style jsx>{`
                  @keyframes scan {
                    0% {
                      transform: translateY(0);
                    }
                    100% {
                      transform: translateY(180px);
                    }
                  }
                  .animate-scan {
                    animation: scan 1.8s linear infinite;
                  }
                `}</style>
              </div>
            )}

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
    </div>
  );
}
