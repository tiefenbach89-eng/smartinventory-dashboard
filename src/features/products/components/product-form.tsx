'use client';

import { FormFileUpload } from '@/components/forms/form-file-upload';
import { FormInput } from '@/components/forms/form-input';
import { FormSelect } from '@/components/forms/form-select';
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
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length === 1, 'Please upload one image.')
    .refine((files) => files?.[0]?.size <= MAX_FILE_SIZE, 'Max file size is 5MB.')
    .refine((files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type), 'Only image files are allowed.'),
  name: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  category: z.string().min(1, { message: 'Please select a category.' }),
  price: z.coerce.number().min(0, { message: 'Price must be positive.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
});

export default function ProductForm({
  initialData,
  pageTitle,
}: {
  initialData: any | null;
  pageTitle: string;
}) {
  const supabase = createClient();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      category: initialData?.category || '',
      price: initialData?.price || 0,
      description: initialData?.description || '',
      image: [],
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      toast.loading('Saving product...');
      let imageUrl: string | null = null;

      // 📸 1️⃣ Upload Image to Supabase Storage
      const file = values.image[0];
      const fileName = `${values.name.replace(/\s+/g, '_')}_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError.message);
        toast.error('Upload failed: ' + uploadError.message);
        return;
      }

      // 📦 2️⃣ Get public URL for the image
      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      imageUrl = data.publicUrl;

      // 🧾 3️⃣ Save Product in "artikel" table
      const { error: insertError } = await supabase.from('artikel').insert({
        artikelnummer: Math.floor(Math.random() * 1000000), // You can later replace this with an auto-generator
        artikelbezeichnung: values.name,
        bestand: 0,
        sollbestand: 0,
        preis: values.price,
        lieferant: values.category,
        image_url: imageUrl,
      });

      if (insertError) {
        console.error('Insert error:', insertError.message);
        toast.error('Database error: ' + insertError.message);
        return;
      }

      toast.success('✅ Product saved successfully!');
      router.push('/dashboard/product');
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong: ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">{pageTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form form={form} onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormFileUpload
            control={form.control}
            name="image"
            label="Product Image"
            description="Upload a product image"
            config={{
              maxSize: MAX_FILE_SIZE,
              maxFiles: 1,
            }}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormInput
              control={form.control}
              name="name"
              label="Product Name"
              placeholder="Enter product name"
              required
            />

            <FormSelect
              control={form.control}
              name="category"
              label="Category"
              placeholder="Select category"
              required
              options={[
                { label: 'Beauty Products', value: 'Beauty' },
                { label: 'Electronics', value: 'Electronics' },
                { label: 'Home & Garden', value: 'Home & Garden' },
                { label: 'Sports & Outdoors', value: 'Sports' },
              ]}
            />

            <FormInput
              control={form.control}
              name="price"
              label="Price (€)"
              placeholder="Enter price"
              required
              type="number"
              min={0}
              step="0.01"
            />
          </div>

          <FormTextarea
            control={form.control}
            name="description"
            label="Description"
            placeholder="Enter product description"
            required
            config={{
              maxLength: 500,
              showCharCount: true,
              rows: 4,
            }}
          />

          <Button type="submit">Add Product</Button>
        </Form>
      </CardContent>
    </Card>
  );
}
