'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Pencil, History, Trash2, Upload, Filter } from 'lucide-react';

// --- Elegant Hover Glow Buttons ---
const btnBase =
  'relative h-8 px-3 text-sm font-medium rounded-2xl border-none ring-0 shadow-none outline-none ' +
  'focus-visible:ring-0 focus-visible:ring-offset-0 transition-all duration-200 hover:-translate-y-[1px] ' +
  'bg-background/40 hover:bg-background/70';

const glowHover = {
  blue: 'hover:shadow-[0_0_12px_-3px_rgba(59,130,246,0.45)] hover:text-blue-400',
  emerald:
    'hover:shadow-[0_0_12px_-3px_rgba(16,185,129,0.45)] hover:text-emerald-400',
  red: 'hover:shadow-[0_0_12px_-3px_rgba(239,68,68,0.45)] hover:text-red-400'
};

export default function ProductListing() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'instock'>('all');
  const [editProduct, setEditProduct] = useState<any | null>(null);
  const [viewLogs, setViewLogs] = useState<any | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  // --- Load products ---
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('artikel').select('*');
      if (error) toast.error('Error loading products: ' + error.message);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [supabase]);

  const filtered = products
    .filter((p) =>
      [p.artikelnummer, p.artikelbezeichnung, p.lieferant, p.beschreibung]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((p) => {
      if (filter === 'low') return p.bestand <= (p.sollbestand || 0);
      if (filter === 'instock') return p.bestand > (p.sollbestand || 0);
      return true;
    });

  // --- Save Product ---
  async function handleSave() {
    if (!editProduct) return;
    try {
      toast.loading('Updating product...');
      let imageUrl = editProduct.image_url;

      if (newImage) {
        const fileName = `${editProduct.artikelnummer}_${Date.now()}_${newImage.name}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, newImage);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase
        .from('artikel')
        .update({
          sollbestand: editProduct.sollbestand,
          beschreibung: editProduct.beschreibung,
          image_url: imageUrl
        })
        .eq('artikelnummer', editProduct.artikelnummer);

      if (error) throw error;
      toast.success('✅ Product updated successfully.');
      setEditProduct(null);
      setNewImage(null);
      const { data } = await supabase.from('artikel').select('*');
      setProducts(data || []);
    } catch (err: any) {
      toast.error('Update failed: ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  // --- Delete Product ---
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      toast.loading('Deleting product...');
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', deleteTarget.artikelnummer);
      if (error) throw error;
      setProducts(
        products.filter((p) => p.artikelnummer !== deleteTarget.artikelnummer)
      );
      toast.success('🗑️ Product deleted successfully.');
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  // --- Load Logs ---
  async function fetchLogs(articleNumber: string) {
    try {
      setLogsLoading(true);
      setViewLogs(articleNumber);
      const { data, error } = await supabase
        .from('artikel_log')
        .select(
          'timestamp, aktion, menge_diff, kommentar, benutzer, lieferscheinnr'
        )
        .eq('artikelnummer', articleNumber)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      toast.error('Failed to load logs: ' + err.message);
    } finally {
      setLogsLoading(false);
    }
  }

  // --- Render ---
  return (
    <div className='w-full px-4 py-6 sm:px-6 md:px-10 md:py-10'>
      {/* Header */}
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-lg font-semibold tracking-tight'>
            Product Management
          </h3>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            Manage products, edit details, or track inventory movements.
          </CardDescription>
        </div>

        {/* Search + Filter Dropdown */}
        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='bg-background/70 h-8 max-w-xs text-sm'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size='sm'
                variant='outline'
                className='flex h-8 items-center gap-2 rounded-xl'
              >
                <Filter className='h-4 w-4' /> Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-32'>
              <DropdownMenuLabel>View</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('instock')}>
                In Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('low')}>
                Low Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* Table */}
      <CardContent>
        {loading ? (
          <div className='flex justify-center py-6'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : (
          <div className='border-border/40 bg-card/60 overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price (€)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stock / Min</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.artikelnummer}>
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.artikelbezeichnung}
                          className='h-10 w-10 cursor-pointer rounded-md object-cover transition-transform hover:scale-105'
                          onDoubleClick={() => setImagePreview(p.image_url)}
                        />
                      ) : (
                        <div className='bg-muted text-muted-foreground flex h-10 w-10 items-center justify-center rounded-md text-xs'>
                          No Image
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{p.artikelnummer}</TableCell>
                    <TableCell>{p.artikelbezeichnung}</TableCell>
                    <TableCell>{p.lieferant}</TableCell>
                    <TableCell>{p.preis?.toFixed(2)}</TableCell>
                    <TableCell className='max-w-[200px] truncate'>
                      {p.beschreibung || '—'}
                    </TableCell>
                    <TableCell>
                      {p.bestand} / {p.sollbestand || 0}
                    </TableCell>

                    <TableCell className='flex flex-wrap gap-2'>
                      {/* --- Edit Button --- */}
                      <Button
                        size='sm'
                        onClick={() => setEditProduct(p)}
                        className={`border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-blue-500 hover:shadow-[0_0_10px_-2px_rgba(59,130,246,0.5)]`}
                      >
                        <Pencil className='mr-1 h-4 w-4' /> Edit
                      </Button>

                      {/* --- Logs Button --- */}
                      <Button
                        size='sm'
                        onClick={() => fetchLogs(p.artikelnummer)}
                        className={`border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-emerald-500 hover:shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]`}
                      >
                        <History className='mr-1 h-4 w-4' /> Logs
                      </Button>

                      {/* --- Delete Button mit Dialog --- */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size='sm'
                            className={`border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-red-500 hover:shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]`}
                            onClick={() => setDeleteTarget(p)}
                          >
                            <Trash2 className='mr-1 h-4 w-4' /> Delete
                          </Button>
                        </AlertDialogTrigger>

                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. Are you sure you
                              want to permanently remove this product?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* --- Edit Dialog --- */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Edit description, min stock, or image.
            </DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className='space-y-4'>
              <div className='flex flex-col items-center gap-3'>
                <img
                  src={
                    editProduct.image_url ||
                    'https://placehold.co/150x150?text=No+Image'
                  }
                  alt='Product'
                  className='h-32 w-32 rounded-md border object-cover'
                />
                <label className='text-primary flex cursor-pointer items-center gap-2 text-sm font-medium hover:underline'>
                  <Upload className='h-4 w-4' /> Change Image
                  <input
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNewImage(file);
                        setEditProduct({
                          ...editProduct,
                          image_url: URL.createObjectURL(file)
                        });
                      }
                    }}
                  />
                </label>
              </div>
              <div>
                <label className='text-sm font-medium'>Description</label>
                <Input
                  value={editProduct.beschreibung || ''}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      beschreibung: e.target.value
                    })
                  }
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Min Stock</label>
                <Input
                  type='number'
                  value={editProduct.sollbestand || 0}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      sollbestand: +e.target.value
                    })
                  }
                />
              </div>
              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setEditProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Logs Dialog --- */}
      <Dialog open={!!viewLogs} onOpenChange={() => setViewLogs(null)}>
        <DialogContent className='bg-background/90 w-full max-w-6xl rounded-2xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <DialogHeader className='px-7 pt-7'>
            <DialogTitle className='text-lg font-semibold'>
              Movement History
            </DialogTitle>
            <DialogDescription className='text-muted-foreground text-sm'>
              Detailed movement log for this product, including delivery notes.
            </DialogDescription>
          </DialogHeader>

          {logsLoading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : logs.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              No movements found.
            </p>
          ) : (
            <div className='border-border/40 mt-3 max-h-[70vh] overflow-y-auto rounded-b-2xl border-t'>
              <Table className='min-w-full text-sm'>
                <TableHeader className='bg-background/90 sticky top-0 z-10 backdrop-blur-md'>
                  <TableRow>
                    <TableHead className='w-[120px]'>Date</TableHead>
                    <TableHead className='w-[120px]'>Action</TableHead>
                    <TableHead className='w-[100px]'>Quantity</TableHead>
                    <TableHead className='w-[200px]'>User</TableHead>
                    <TableHead className='w-[200px]'>Delivery Note</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((l, i) => (
                    <TableRow
                      key={i}
                      className='hover:bg-muted/30 transition-colors duration-150'
                    >
                      {/* Date */}
                      <TableCell className='whitespace-nowrap'>
                        {new Date(l.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>

                      {/* Action */}
                      <TableCell>
                        <Badge
                          className={`rounded-lg border px-2 py-[2px] text-xs font-medium backdrop-blur-sm ${
                            l.menge_diff >= 0
                              ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                              : 'border-red-500/20 bg-red-500/15 text-red-400'
                          }`}
                        >
                          {l.menge_diff >= 0 ? 'Added' : 'Removed'}
                        </Badge>
                      </TableCell>

                      {/* Quantity */}
                      <TableCell className='whitespace-nowrap'>
                        {Math.abs(l.menge_diff)}
                      </TableCell>

                      {/* User */}
                      <TableCell className='text-foreground'>
                        {l.benutzer || 'System'}
                      </TableCell>

                      {/* Delivery Note — dynamische Theme-Farbe */}
                      <TableCell>
                        {l.lieferscheinnr ? (
                          <span className='border-primary/30 text-primary bg-primary/10 inline-flex items-center rounded-md border px-2 py-[2px] font-mono text-xs font-medium tracking-wide whitespace-nowrap backdrop-blur-sm'>
                            {l.lieferscheinnr}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>

                      {/* Comment */}
                      <TableCell className='text-muted-foreground max-w-[300px] truncate'>
                        {l.kommentar || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* --- Image Preview Dialog (Double-Click) --- */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className='bg-background/90 max-w-3xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <DialogHeader className='sr-only'>
            <DialogTitle>Product Image Preview</DialogTitle>
            <DialogDescription>Enlarged product image</DialogDescription>
          </DialogHeader>
          {imagePreview && (
            <img
              src={imagePreview}
              alt='Product preview'
              className='h-auto w-full rounded-xl object-contain transition-all duration-300'
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
