'use client';

import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
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
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Pencil, History, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction
} from '@/components/ui/alert-dialog';

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

  // 🟡 Load products
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

  // 🧠 Filter + Search
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

  // ✏️ Save changes from Edit modal
  async function handleSave() {
    if (!editProduct) return;

    const original = products.find(
      (p) => p.artikelnummer === editProduct.artikelnummer
    );

    if (!original) {
      toast.error('Original product data not found.');
      return;
    }

    const hasChanged =
      editProduct.sollbestand !== original.sollbestand ||
      editProduct.beschreibung !== original.beschreibung;

    if (!hasChanged) {
      toast.warning(
        '⚠️ No changes detected. Please update at least one field.'
      );
      return;
    }

    const { error } = await supabase
      .from('artikel')
      .update({
        bestand: editProduct.bestand,
        sollbestand: editProduct.sollbestand,
        beschreibung: editProduct.beschreibung
      })
      .eq('artikelnummer', editProduct.artikelnummer);

    if (error) {
      toast.error('Update failed: ' + error.message);
    } else {
      toast.success('✅ Product updated successfully.');
      setEditProduct(null);
      const { data } = await supabase.from('artikel').select('*');
      setProducts(data || []);
    }
  }

  // 🗑️ Delete product (now using modern confirmation dialog)
  async function handleDelete(articleNumber: string) {
    try {
      toast.loading('Deleting product...');
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', articleNumber);
      if (error) throw error;

      setProducts(products.filter((p) => p.artikelnummer !== articleNumber));
      toast.success('Product deleted successfully.');
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    } finally {
      toast.dismiss();
    }
  }

  // 📦 Fetch logs <<
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

  return (
    <Card>
      <CardHeader className='flex items-center justify-between'>
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage products and track movements</CardDescription>
        </div>

        <div className='flex items-center gap-2'>
          <Input
            placeholder='Search products...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-xs'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline'>View</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>
                Show All
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

      <CardContent>
        {loading ? (
          <div className='flex justify-center py-6'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : (
          <div className='overflow-auto rounded-md border'>
            <div className='min-w-[800px] md:min-w-full'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Article Number</TableHead>
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
                    <TableRow key={p.artikelnummer} className='align-top'>
                      <TableCell>
                        {p.image_url ? (
                          <img
                            src={
                              p.image_url.trim() !== ''
                                ? p.image_url
                                : 'https://placehold.co/100x100?text=No+Image'
                            }
                            alt={p.artikelbezeichnung || 'Product Image'}
                            className='h-10 w-10 cursor-pointer rounded-md object-cover transition-transform hover:scale-105'
                            onDoubleClick={() =>
                              setImagePreview(
                                p.image_url.trim() !== ''
                                  ? p.image_url
                                  : 'https://placehold.co/600x600?text=No+Image'
                              )
                            }
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
                        Stock: {p.bestand} / Min: {p.sollbestand || 0}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-2 md:flex-row'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => setEditProduct(p)}
                          >
                            <Pencil className='mr-1 h-4 w-4' /> Edit
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => fetchLogs(p.artikelnummer)}
                          >
                            <History className='mr-1 h-4 w-4' /> Movements
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size='sm' variant='destructive'>
                                <Trash2 className='mr-1 h-4 w-4' /> Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete product?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. The product will
                                  be permanently removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(p.artikelnummer)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>

      {/* ✏️ Edit Modal */}
      {editProduct && (
        <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
              <DialogDescription>
                Adjust product details. Core data like article number or name is
                not editable.
              </DialogDescription>
            </DialogHeader>

            {/* Image Preview */}
            {editProduct.image_url && (
              <img
                src={editProduct.image_url}
                alt='Preview'
                className='mx-auto mb-4 h-36 rounded-md object-contain'
              />
            )}

            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Article Number</label>
                <Input value={editProduct.artikelnummer} disabled />
              </div>
              <div>
                <label className='text-sm font-medium'>Product Name</label>
                <Input value={editProduct.artikelbezeichnung} disabled />
              </div>
              <div>
                <label className='text-sm font-medium'>Supplier</label>
                <Input value={editProduct.lieferant} disabled />
              </div>
              <div>
                <label className='text-sm font-medium'>Price (€)</label>
                <Input
                  type='number'
                  value={editProduct.preis || ''}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, preis: +e.target.value })
                  }
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Minimum Stock</label>
                <Input
                  type='number'
                  value={editProduct.sollbestand || ''}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      sollbestand: +e.target.value
                    })
                  }
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Description</label>
                <Textarea
                  value={editProduct.beschreibung || ''}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      beschreibung: e.target.value
                    })
                  }
                  placeholder='Optional'
                />
              </div>
            </div>

            <div className='mt-6 flex justify-end gap-2'>
              <Button variant='outline' onClick={() => setEditProduct(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 🧾 Logs Modal with Delivery Note */}
      <Dialog open={!!viewLogs} onOpenChange={() => setViewLogs(null)}>
        <DialogContent className='w-full max-w-4xl'>
          <DialogTitle>
            Movement History for:{' '}
            <span className='font-semibold'>
              {products.find((p) => p.artikelnummer === viewLogs)
                ?.artikelbezeichnung || 'Unknown'}
            </span>
            <span className='text-muted-foreground block text-sm'>
              Article #{viewLogs}
            </span>
          </DialogTitle>

          {logsLoading ? (
            <div className='flex justify-center py-6'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : logs.length === 0 ? (
            <p className='text-muted-foreground text-sm'>No movements found.</p>
          ) : (
            <div className='mt-3 overflow-hidden rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className='text-right'>Quantity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Delivery Note</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.menge_diff >= 0
                              ? 'border-green-500/30 bg-green-500/20 text-green-400'
                              : 'border-red-500/30 bg-red-500/20 text-red-400'
                          }
                        >
                          {log.menge_diff >= 0 ? 'Added' : 'Removed'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        {Math.abs(log.menge_diff)}
                      </TableCell>
                      <TableCell>{log.benutzer || 'System'}</TableCell>
                      <TableCell>
                        {log.lieferscheinnr ? (
                          <span className='text-primary font-medium'>
                            {log.lieferscheinnr}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>
                      <TableCell>{log.kommentar || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🖼️ Image Preview */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className='max-w-3xl border-none p-0 shadow-lg'>
          <VisuallyHidden>
            <DialogTitle>Product Image Preview</DialogTitle>
          </VisuallyHidden>
          {imagePreview && (
            <img
              src={imagePreview}
              alt='Product Preview'
              className='h-auto w-full rounded-lg'
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
