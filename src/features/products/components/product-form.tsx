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

// ✅ Neues Schema – Pflichtfelder korrekt definiert
const formSchema = z.object({
  artikelnummer: z.coerce
    .number()
    .min(1, { message: 'Article number is required.' }),
  name: z
    .string()
    .min(2, { message: 'Product name must be at least 2 characters.' }),
  supplier: z.string().min(1, { message: 'Supplier is required.' }),
  price: z.coerce.number().optional(),
  quantity: z.coerce.number().optional(),
  minStock: z.coerce.number().optional(),
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

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: any | null;
  pageTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      artikelnummer: initialData?.artikelnummer || '',
      name: initialData?.name || '',
      supplier: initialData?.supplier || '',
      price: initialData?.price || 0,
      quantity: initialData?.quantity || 0,
      minStock: initialData?.minStock || 0,
      description: initialData?.description || '',
      image: []
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      toast.loading('Saving product...');
      let imageUrl: string | null = null;

      // Upload Image
      const file = values.image[0];
      const fileName = `${values.name.replace(/\s+/g, '_')}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        toast.error('Upload failed: ' + uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);
      imageUrl = data.publicUrl;

      // Insert Product into artikel
      const { error: insertError } = await supabase.from('artikel').insert({
        artikelnummer: values.artikelnummer.toString(),
        artikelbezeichnung: values.name,
        beschreibung: values.description || null,
        bestand: values.quantity,
        sollbestand: values.minStock,
        preis: values.price,
        lieferant: values.supplier,
        image_url: imageUrl
      });

      if (insertError) {
        toast.error('Database error: ' + insertError.message);
        return;
      }

      toast.success('✅ Product saved successfully!');
      router.push('/dashboard/product');
    } catch (err: any) {
      toast.error('Something went wrong: ' + err.message);
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
        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-8'
        >
          {/* Upload-Bereich */}
          <FormFileUpload
            control={form.control}
            name='image'
            label='Product Image'
            description='Upload a product image'
            config={{ maxSize: MAX_FILE_SIZE, maxFiles: 1 }}
          />

          {/* 👇 Grid mit fixierter Zeilenhöhe */}
          <div className='grid auto-rows-min grid-cols-1 items-start gap-6 md:grid-cols-2'>
            <FormInput
              control={form.control}
              name='artikelnummer'
              label='Article Number'
              placeholder='Enter article number'
              required
              type='text'
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
              required={false}
              type='number'
              min={0}
              step='0.01'
            />
            <FormInput
              control={form.control}
              name='quantity'
              label='Stock Quantity'
              placeholder='Enter current stock'
              required={false}
              type='number'
              min={0}
            />
            <FormInput
              control={form.control}
              name='minStock'
              label='Minimum Stock'
              placeholder='Enter minimum stock'
              required={false}
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
