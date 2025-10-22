'use client';

import { FormFileUpload } from '@/components/forms/form-file-upload';
import { FormInput } from '@/components/forms/form-input';
import { FormTextarea } from '@/components/forms/form-textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { createClient } from '@/lib/supabase/client';
import { zodResolver } from '@hookform/resolvers/zod';
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

// ✅ Zod Schema
const formSchema = z.object({
  artikelnummer: z.coerce
    .number()
    .min(1, { message: 'Article number is required.' }),
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters.' }),
  supplier: z.string().min(1, { message: 'Supplier is required.' }),
  price: z.coerce.number().default(0),
  quantity: z.coerce.number().default(0),
  minStock: z.coerce.number().default(0),
  description: z.string().optional(),
  image: z
    .any()
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

// ✅ Typ-Ableitung (einheitlich für useForm & onSubmit)
type ProductFormValues = z.infer<typeof formSchema>;

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Partial<ProductFormValues> | null;
  pageTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  // ✅ useForm sauber typisiert
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      artikelnummer: Number(initialData?.artikelnummer ?? 0),
      name: String(initialData?.name ?? ''),
      supplier: String(initialData?.supplier ?? ''),
      price: Number(initialData?.price ?? 0),
      quantity: Number(initialData?.quantity ?? 0),
      minStock: Number(initialData?.minStock ?? 0),
      description: String(initialData?.description ?? ''),
      image: []
    }
  });

  // ✅ Submit-Handler
  async function onSubmit(values: ProductFormValues) {
    try {
      toast.loading('Saving product...');
      let imageUrl: string | null = null;

      const file = values.image[0];
      const fileName = `${values.name.replace(/\s+/g, '_')}_${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;

      const { error: insertError } = await supabase.from('artikel').insert({
        artikelnummer: String(values.artikelnummer),
        artikelbezeichnung: values.name,
        beschreibung: values.description || null,
        bestand: values.quantity,
        sollbestand: values.minStock,
        preis: values.price,
        lieferant: values.supplier,
        image_url: imageUrl
      });

      if (insertError) throw new Error(insertError.message);

      toast.success('✅ Product saved successfully!');
      router.push('/dashboard/product');
    } catch (err: any) {
      toast.error('❌ ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form form={form} onSubmit={onSubmit} className='space-y-8'>
          {/* Upload */}
          <FormFileUpload
            control={form.control}
            name='image'
            label='Product Image'
            description='Upload a product image'
            config={{ maxSize: MAX_FILE_SIZE, maxFiles: 1 }}
          />

          {/* Inputs */}
          <div className='grid auto-rows-min grid-cols-1 items-start gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='artikelnummer'
              label='Article Number'
              placeholder='Enter article number'
              required
              type='number'
              min={1}
            />
            <FormInput
              control={form.control}
              name='name'
              label='Product Name'
              placeholder='Enter product name'
              required
            />
            <FormInput
              control={form.control}
              name='supplier'
              label='Supplier'
              placeholder='Enter supplier name'
              required
            />
            <FormInput
              control={form.control}
              name='price'
              label='Price (€)'
              placeholder='Enter price'
              type='number'
              step='0.01'
              min={0}
            />
            <FormInput
              control={form.control}
              name='quantity'
              label='Stock Quantity'
              placeholder='Enter current stock'
              type='number'
              min={0}
            />
            <FormInput
              control={form.control}
              name='minStock'
              label='Minimum Stock'
              placeholder='Enter minimum stock'
              type='number'
              min={0}
            />
          </div>

          <FormTextarea
            control={form.control}
            name='description'
            label='Description'
            placeholder='Enter product description'
            config={{ maxLength: 500, showCharCount: true, rows: 4 }}
          />

          <Button type='submit'>Add Product</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
