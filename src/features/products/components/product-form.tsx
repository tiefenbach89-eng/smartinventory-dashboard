'use client';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

// ✅ sauberes Schema mit File[]
const formSchema = z.object({
  artikelnummer: z.coerce
    .number()
    .min(1, { message: 'Article number is required.' }),
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters.' }),
  supplier: z.string().min(1, { message: 'Supplier is required.' }),
  price: z.coerce
    .number()
    .min(0.01, { message: 'Price must be greater than 0.' }),
  minStock: z.coerce.number().min(1, { message: 'Minimum stock is required.' }),
  description: z.string().optional(),
  image: z
    .custom<File[]>()
    .refine((files) => files?.length === 1, 'Please upload one image.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      'Max file size is 5MB.'
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      'Only image files are allowed.'
    )
});

type ProductFormValues = z.infer<typeof formSchema>;

export default function ProductForm({
  initialData,
  pageTitle = 'List New Product'
}: {
  initialData: Partial<ProductFormValues>;
  pageTitle?: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  // ✅ Mounted-Flag für sicheren Client-Render
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // ✅ useForm wird immer aufgerufen (keine Bedingung!)
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as unknown as Resolver<ProductFormValues>,
    defaultValues: {
      artikelnummer: initialData?.artikelnummer ?? 0,
      name: initialData?.name ?? '',
      supplier: initialData?.supplier ?? '',
      price: initialData?.price ?? 0,
      minStock: initialData?.minStock ?? 0,
      description: initialData?.description ?? '',
      image: []
    }
  });

  // ✅ Render-Block erst nach Mount (verhindert Hydration Error)
  if (!mounted) {
    return (
      <div className='text-muted-foreground flex h-[50vh] items-center justify-center'>
        <p>Loading product form...</p>
      </div>
    );
  }

  async function onSubmit(values: ProductFormValues) {
    try {
      toast.loading('Saving product...');
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
        image_url: imageUrl
      });
      if (insertError) throw new Error(insertError.message);

      toast.success('✅ Product listed successfully!');
      router.push('/dashboard/product');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  // ✅ Restlicher JSX bleibt unverändert
  return (
    <div className='w-full px-6 py-10'>
      <CardModern className='border-border/40 from-primary/10 via-card/70 to-background/30 hover:border-primary/40 hover:shadow-primary/20 w-full transform-none space-y-8 border bg-gradient-to-b p-8 shadow-sm backdrop-blur-sm transition-all duration-300 hover:transform-none hover:shadow-lg'>
        <CardHeader>
          <CardTitle className='text-2xl font-semibold'>{pageTitle}</CardTitle>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            Fill out the product details below.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Form form={form} onSubmit={onSubmit} className='space-y-8'>
            <FormFileUpload
              control={form.control}
              name='image'
              label='Product Image'
              description='Upload a product image'
              config={{ maxSize: MAX_FILE_SIZE, maxFiles: 1 }}
              required
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormInput
                control={form.control}
                name='artikelnummer'
                label='Article Number'
                type='number'
                min={1}
                required
              />
              <FormInput
                control={form.control}
                name='name'
                label='Product Name'
                required
              />
              <FormInput
                control={form.control}
                name='supplier'
                label='Supplier'
                required
              />
              <FormInput
                control={form.control}
                name='price'
                label='Price (€)'
                type='number'
                step='0.01'
                required
              />
              <FormInput
                control={form.control}
                name='minStock'
                label='Minimum Stock'
                type='number'
                min={1}
                required
              />
            </div>

            <FormTextarea
              control={form.control}
              name='description'
              label='Description'
              placeholder='Enter product description'
              config={{ maxLength: 500, showCharCount: true, rows: 4 }}
            />

            <Button type='submit' className='w-full md:w-auto'>
              {pageTitle.includes('Edit') ? 'Save Changes' : 'List Product'}
            </Button>
          </Form>
        </CardContent>
      </CardModern>
    </div>
  );
}
