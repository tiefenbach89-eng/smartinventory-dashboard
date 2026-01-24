'use client';

import { useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription
} from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';

export interface ProductRow {
  id: string;
  name: string;
  supplier: string;
  price: number;
  description: string;
  stock: string;
  photo_url: string;
}

// Simple Typ für unsere Übersetzungsfunktion (namespaced: ProductListing)
type TFn = (key: string, values?: Record<string, any>) => string;

/** 🔹 Bild-Komponente mit Dialog */
function ProductImage({ url, alt, t }: { url: string; alt: string; t: TFn }) {
  const [open, setOpen] = useState(false);

  if (!url) {
    return (
      <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-xs'>
        {t('noImage')}
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail */}
      <img
        src={url}
        alt={alt}
        onDoubleClick={() => setOpen(true)}
        className='h-16 w-16 cursor-pointer rounded-md object-cover transition-transform hover:scale-105'
      />

      {/* Dialog mit großem Bild */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='max-w-3xl border-none p-0 shadow-lg'>
          {/* Unsichtbarer Titel für Barrierefreiheit */}
          <VisuallyHidden>
            <DialogTitle>{alt}</DialogTitle>
          </VisuallyHidden>

          <img src={url} alt={alt} className='h-auto w-full rounded-lg' />
        </DialogContent>
      </Dialog>
    </>
  );
}

/** 🔹 Delete-Button mit Dialog */
function DeleteButton({ product, t }: { product: ProductRow; t: TFn }) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    try {
      setLoading(true);
      toast.loading(t('toastDeleting'));

      // 1️⃣ Optional: Bild aus Supabase Storage löschen
      if (product.photo_url) {
        const fileName = product.photo_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('product-images').remove([fileName]);
        }
      }

      // 2️⃣ Produkt aus "artikel"-Tabelle löschen
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', product.id);

      if (error) throw error;

      toast.success(t('toastDeleted'));
      setOpen(false);
    } catch (err: any) {
      toast.error(
        t('toastDeleteFailed', {
          message: err?.message ?? 'Unknown error'
        })
      );
    } finally {
      setLoading(false);
      toast.dismiss();
    }
  };

  return (
    <>
      <Button
        variant='destructive'
        size='sm'
        onClick={() => setOpen(true)}
        className='bg-red-600 text-white hover:bg-red-700'
      >
        {t('delete')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>{t('deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className='flex justify-end space-x-2'>
            <Button
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              {t('cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={handleDelete}
              disabled={loading}
              className='bg-red-600 text-white hover:bg-red-700'
            >
              {loading ? t('toastDeleting') : t('delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * 🔹 Factory-Funktion für Columns
 * Wird von der aufrufenden Komponente mit `t = useTranslations('ProductListing')` versorgt.
 */
export const createProductColumns = (t: TFn): ColumnDef<ProductRow>[] => [
  {
    accessorKey: 'photo_url',
    header: t('colImage'),
    cell: ({ row }) => (
      <ProductImage
        url={row.original.photo_url}
        alt={row.original.name || 'Product Image'}
        t={t}
      />
    )
  },
  {
    accessorKey: 'id',
    header: t('colArticle'),
    cell: ({ row }) => (
      <div className='text-muted-foreground text-sm'>{row.original.id}</div>
    )
  },
  {
    accessorKey: 'name',
    header: t('colName'),
    cell: ({ row }) => <div className='font-medium'>{row.original.name}</div>
  },
  {
    accessorKey: 'supplier',
    header: t('colSupplier'),
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.supplier}</span>
    )
  },
  {
    accessorKey: 'price',
    header: t('colPrice'),
    cell: ({ row }) => (
      <div className='font-semibold'>{row.original.price.toFixed(2)} €</div>
    )
  },
  {
    accessorKey: 'description',
    header: t('colDescription'),
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.description}</span>
    )
  },
  {
    accessorKey: 'stock',
    header: t('colStock'),
    cell: ({ row }) => (
      <span className='text-muted-foreground'>{row.original.stock}</span>
    )
  },
  {
    id: 'actions',
    header: t('colActions'),
    cell: ({ row }) => <DeleteButton product={row.original} t={t} />
  }
];
