'use client';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
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

// 🌍 next-intl
import { useTranslations } from 'next-intl';

// Scanner wird dynamisch geladen – Next.js & iPad sicher
async function scanEAN(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') return null;

    // ❗ Prüfen ob Kamera API existiert
    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== 'function'
    ) {
      toast.error('Dieses Gerät unterstützt kein Kamera-Scanning.');
      return null;
    }

    // Dynamisch laden (Next.js SSR-Safe)
    const { BrowserMultiFormatReader } = await import('@zxing/browser');
    const reader = new BrowserMultiFormatReader();

    // Jetzt erst scannen
    const result = await reader.decodeOnceFromVideoDevice(undefined);

    // Erfolgreich
    if (result) {
      const text = result.getText();
      (reader as any).reset?.();
      return text;
    }

    return null;
  } catch (err) {
    console.error(err);
    toast.error('Scan fehlgeschlagen.');
    return null;
  }
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: any;
  pageTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const t = useTranslations('ProductForm'); // ← ALLES übersetzbar

  // Validation Schema mit Übersetzungen
  const formSchema = z.object({
    artikelnummer: z.coerce
      .number()
      .min(1, { message: t('errorArticleNumber') }),
    name: z.string().min(2, { message: t('errorName') }),
    supplier: z.string().min(1, { message: t('errorSupplier') }),
    price: z.coerce.number().min(0.01, { message: t('errorPrice') }),
    minStock: z.coerce.number().min(1, { message: t('errorMinStock') }),
    description: z.string().optional(),
    image: z
      .custom<File[]>()
      .refine((files) => files?.length === 1, t('errorImageRequired'))
      .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, t('errorFileSize'))
      .refine(
        (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
        t('errorFileType')
      ),
    ean: z.string().optional() // ← EAN IST OPTIONAL
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const form = useForm<any>({
    resolver: zodResolver(formSchema) as unknown as Resolver<any>,
    defaultValues: {
      artikelnummer: initialData?.artikelnummer ?? 0,
      name: initialData?.name ?? '',
      supplier: initialData?.supplier ?? '',
      price: initialData?.price ?? 0,
      minStock: initialData?.minStock ?? 0,
      description: initialData?.description ?? '',
      ean: initialData?.ean ?? '', // ← EAN default
      image: []
    }
  });

  if (!mounted) {
    return (
      <div className='text-muted-foreground flex h-[50vh] items-center justify-center'>
        <p>{t('loading')}</p>
      </div>
    );
  }

  async function onSubmit(values: any) {
    try {
      toast.loading(t('saving'));

      const file = values.image[0];
      const fileName = `${values.name.replace(/\s+/g, '_')}_${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      const imageUrl = data.publicUrl;

      const { error: insertError } = await supabase.from('artikel').insert({
        artikelnummer: String(values.artikelnummer),
        artikelbezeichnung: values.name,
        beschreibung: values.description || null,
        lieferant: values.supplier,
        preis: values.price,
        sollbestand: values.minStock,
        ean: values.ean || null, // ← EAN wird gespeichert
        image_url: imageUrl
      });

      if (insertError) throw new Error(insertError.message);

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
      <CardModern className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/20 w-full space-y-8 border bg-gradient-to-b p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:shadow-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold'>{pageTitle}</CardTitle>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            {t('description')}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit} className='space-y-8'>
            <FormFileUpload
              control={form.control}
              name='image'
              label={t('imageLabel')}
              description={t('imageDescription')}
              config={{ maxSize: MAX_FILE_SIZE, maxFiles: 1 }}
              required
            />

            {/* GRUND-FELDER */}
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='artikelnummer'
                label={t('artikelnummer')}
                type='number'
                min={1}
                required
              />
              <FormInput
                control={form.control}
                name='name'
                label={t('name')}
                required
              />
              <FormInput
                control={form.control}
                name='supplier'
                label={t('supplier')}
                required
              />
              <FormInput
                control={form.control}
                name='price'
                label={t('price')}
                type='number'
                step='0.01'
                required
              />
              <FormInput
                control={form.control}
                name='minStock'
                label={t('minStock')}
                type='number'
                min={1}
                required
              />
            </div>

            {/* 🔥 EAN-Feld → Eingabe + Scan */}
            <div>
              <label className='mb-1 block text-sm font-medium'>
                {t('eanLabel')}
              </label>

              <div className='relative flex items-center'>
                <Input
                  {...form.register('ean')}
                  placeholder={t('eanPlaceholder')}
                  className='pr-16'
                />

                {/* Kamera-Scan Button */}
                <button
                  type='button'
                  className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex h-full w-12 items-center justify-center'
                  onClick={async () => {
                    const scanned = await scanEAN();
                    if (scanned) {
                      form.setValue('ean', scanned);
                      toast.success(t('eanScanned'));
                    } else {
                      toast.error(t('eanScanFailed'));
                    }
                  }}
                >
                  {/* Big Barcode Icon (iPad friendly) */}
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-7 w-7'
                    viewBox='0 0 24 24'
                    fill='currentColor'
                  >
                    <path d='M4 5h1v14H4V5Zm15 0h1v14h-1V5ZM7 9h1v6H7V9Zm4 0h1v6h-1V9Zm4 0h1v6h-1V9Z' />
                  </svg>
                </button>
              </div>
            </div>

            {/* Beschreibung */}
            <FormTextarea
              control={form.control}
              name='description'
              label={t('descriptionLabel')}
              placeholder={t('descriptionPlaceholder')}
              config={{ maxLength: 500, showCharCount: true, rows: 4 }}
            />

            <Button type='submit' className='w-full md:w-auto'>
              {pageTitle.includes('Edit')
                ? t('buttonSaveChanges')
                : t('buttonList')}
            </Button>
          </Form>
        </CardContent>
      </CardModern>
    </div>
  );
}
