'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogDescription,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

export interface ProductRow {
  id: string
  name: string
  supplier: string
  price: number
  description: string
  stock: string
  photo_url: string
}

/** 🔹 Separate Komponente für das Bild mit Dialog */
function ProductImage({ url, alt }: { url: string; alt: string }) {
  const [open, setOpen] = useState(false)

  if (!url) {
    return (
      <div className="h-10 w-10 rounded-md bg-muted text-xs flex items-center justify-center text-muted-foreground">
        No Image
      </div>
    )
  }

  return (
    <>
      {/* Thumbnail */}
      <img
        src={url}
        alt={alt}
        onDoubleClick={() => setOpen(true)}
        className="h-16 w-16 rounded-md object-cover cursor-pointer hover:scale-105 transition-transform"
      />

      {/* Dialog mit großem Bild */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 border-none shadow-lg">
          {/* Unsichtbarer Titel für Barrierefreiheit */}
          <VisuallyHidden>
            <DialogTitle>Product image: {alt}</DialogTitle>
          </VisuallyHidden>

          <img
            src={url}
            alt={alt}
            className="w-full h-auto rounded-lg"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

/** 🔹 Delete-Button mit Dialog im shadcn-Stil */
function DeleteButton({ product }: { product: ProductRow }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    try {
      setLoading(true)
      toast.loading('Deleting product...')

      // 1️⃣ Optional: Bild aus Supabase Storage löschen
      if (product.photo_url) {
        const fileName = product.photo_url.split('/').pop()
        if (fileName) {
          await supabase.storage.from('product-images').remove([fileName])
        }
      }

      // 2️⃣ Produkt aus "artikel"-Tabelle löschen
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', product.id)

      if (error) throw error

      toast.success(`✅ "${product.name}" deleted successfully!`)
      setOpen(false)
    } catch (err: any) {
      console.error('❌ Delete error:', err)
      toast.error('Failed to delete product: ' + err.message)
    } finally {
      setLoading(false)
      toast.dismiss()
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
        className="bg-red-600 hover:bg-red-700 text-white"
      >
        Delete
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <span className="font-semibold text-foreground">
                {product.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {loading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const columns: ColumnDef<ProductRow>[] = [
  {
    accessorKey: 'photo_url',
    header: 'Image',
    cell: ({ row }) => (
      <ProductImage
        url={row.original.photo_url}
        alt={row.original.name || 'Product Image'}
      />
    ),
  },
  {
    accessorKey: 'id',
    header: 'Article Number',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">{row.original.id}</div>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: 'supplier',
    header: 'Supplier',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.supplier}</span>
    ),
  },
  {
    accessorKey: 'price',
    header: 'Price (€)',
    cell: ({ row }) => (
      <div className="font-semibold">{row.original.price.toFixed(2)} €</div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.description}</span>
    ),
  },
  {
    accessorKey: 'stock',
    header: 'Stock / Min',
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.stock}</span>
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => <DeleteButton product={row.original} />,
  },
]
