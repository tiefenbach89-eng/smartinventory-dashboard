'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
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

// 🌍 next-intl
import { useTranslations } from 'next-intl';

// 🔐 Neu: Props für Permissions (wird von ProductsPage übergeben)
type ProductListingProps = {
  canManageProducts?: boolean; // Admin/Manager = true, Employee = false
};

export default function ProductListing({
  canManageProducts = false
}: ProductListingProps) {
  const t = useTranslations('ProductListing');
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

  // ----------------------------------------------------------------------------------------------------
  // LOAD PRODUCTS
  // ----------------------------------------------------------------------------------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('artikel').select('*');
      if (error) toast.error(t('errorLoadProducts'));
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [supabase, t]);

  // ----------------------------------------------------------------------------------------------------
  // FILTER + SEARCH (inkl. EAN)
  // ----------------------------------------------------------------------------------------------------
  const filtered = products
    .filter((p) =>
      [
        p.artikelnummer,
        p.artikelbezeichnung,
        p.lieferant,
        p.beschreibung,
        p.ean // ← durchsuchen
      ]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((p) => {
      if (filter === 'low') return p.bestand <= (p.sollbestand || 0);
      if (filter === 'instock') return p.bestand > (p.sollbestand || 0);
      return true;
    });

  // ----------------------------------------------------------------------------------------------------
  // SAVE PRODUCT
  // ----------------------------------------------------------------------------------------------------
  async function handleSave() {
    if (!editProduct) return;
    if (!canManageProducts) {
      toast.error(t('noPermission'));
      return;
    }

    try {
      toast.loading(t('toastUpdating'));
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
          ean: editProduct.ean || null,
          image_url: imageUrl
        })
        .eq('artikelnummer', editProduct.artikelnummer);

      if (error) throw error;

      toast.success(t('toastUpdated'));
      setEditProduct(null);
      setNewImage(null);

      const { data } = await supabase.from('artikel').select('*');
      setProducts(data || []);
    } catch (err: any) {
      toast.error(t('toastUpdateFailed', { message: err.message }));
    } finally {
      toast.dismiss();
    }
  }

  // ----------------------------------------------------------------------------------------------------
  // DELETE PRODUCT
  // ----------------------------------------------------------------------------------------------------
  async function confirmDelete() {
    if (!deleteTarget) return;
    if (!canManageProducts) {
      toast.error(t('noPermission'));
      return;
    }

    try {
      toast.loading(t('toastDeleting'));
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', deleteTarget.artikelnummer);

      if (error) throw error;

      setProducts((prev) =>
        prev.filter((p) => p.artikelnummer !== deleteTarget.artikelnummer)
      );

      toast.success(t('toastDeleted'));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(t('toastDeleteFailed', { message: err.message }));
    } finally {
      toast.dismiss();
    }
  }

  // ----------------------------------------------------------------------------------------------------
  // LOAD LOGS
  // ----------------------------------------------------------------------------------------------------
  async function fetchLogs(articleNumber: string) {
    try {
      setLogsLoading(true);
      setViewLogs(articleNumber);

      const { data, error } = await supabase
        .from('artikel_log')
        .select(
          'timestamp, aktion, menge_diff, kommentar, benutzer, lieferscheinnr'
        )
        .eq('artikelnummer', String(articleNumber))
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      toast.error(t('toastLogFailed', { message: err.message }));
    } finally {
      setLogsLoading(false);
    }
  }

  // ----------------------------------------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------------------------------------
  return (
    <div className='w-full px-4 py-6 sm:px-6 md:px-10 md:py-10'>
      <CardHeader className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h3 className='text-lg font-semibold tracking-tight'>{t('title')}</h3>
          <CardDescription className='text-muted-foreground mt-1 text-sm'>
            {t('subtitle')}
          </CardDescription>
        </div>

        {/* SEARCH + FILTER */}
        <div className='flex items-center gap-2'>
          <Input
            placeholder={t('searchPlaceholder')}
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
                <Filter className='h-4 w-4' /> {t('filter')}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-36'>
              <DropdownMenuLabel>{t('filterTitle')}</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setFilter('all')}>
                {t('filterAll')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setFilter('instock')}>
                {t('filterInstock')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setFilter('low')}>
                {t('filterLow')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      {/* TABLE */}
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
                  <TableHead>{t('colImage')}</TableHead>
                  <TableHead>{t('colArticle')}</TableHead>
                  <TableHead>{t('colName')}</TableHead>
                  <TableHead>{t('colSupplier')}</TableHead>
                  <TableHead>{t('colPrice')}</TableHead>
                  <TableHead>{t('colEAN')}</TableHead>
                  <TableHead>{t('colDescription')}</TableHead>
                  <TableHead>{t('colStock')}</TableHead>
                  <TableHead>{t('colActions')}</TableHead>
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
                          {t('noImage')}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>{p.artikelnummer}</TableCell>
                    <TableCell>{p.artikelbezeichnung}</TableCell>
                    <TableCell>{p.lieferant}</TableCell>
                    <TableCell>{p.preis?.toFixed(2)}</TableCell>

                    {/* EAN */}
                    <TableCell className='font-mono text-xs'>
                      {p.ean || '—'}
                    </TableCell>

                    <TableCell className='max-w-[200px] truncate'>
                      {p.beschreibung || '—'}
                    </TableCell>

                    <TableCell>
                      {p.bestand} / {p.sollbestand || 0}
                    </TableCell>

                    {/* ACTION BUTTONS */}
                    <TableCell className='whitespace-nowrap'>
                      <div className='flex flex-wrap gap-2'>
                        {/* 📘 LOGS Button – für alle Rollen erlaubt */}
                        <Button
                          size='sm'
                          onClick={() => fetchLogs(p.artikelnummer)}
                          className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-emerald-500 hover:shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]'
                        >
                          <History className='mr-1 h-4 w-4' /> {t('logs')}
                        </Button>

                        {/* ✏️ EDIT Button – nur wenn canManageProducts */}
                        {canManageProducts && (
                          <Button
                            size='sm'
                            onClick={() => setEditProduct(p)}
                            className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-yellow-500 hover:shadow-[0_0_10px_-2px_rgba(234,179,8,0.5)]'
                          >
                            <Pencil className='mr-1 h-4 w-4' /> {t('edit')}
                          </Button>
                        )}

                        {/* 🗑 DELETE – nur wenn canManageProducts */}
                        {canManageProducts && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size='sm'
                                onClick={() => setDeleteTarget(p)}
                                className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-3 text-sm font-medium transition-all duration-200 hover:text-red-500 hover:shadow-[0_0_10px_-2px_rgba(239,68,68,0.5)]'
                              >
                                <Trash2 className='mr-1 h-4 w-4' />{' '}
                                {t('delete')}
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {t('deleteTitle')}
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {t('deleteDescription')}
                                </AlertDialogDescription>
                              </AlertDialogHeader>

                              <AlertDialogFooter>
                                <AlertDialogCancel>
                                  {t('cancel')}
                                </AlertDialogCancel>
                                <AlertDialogAction onClick={confirmDelete}>
                                  {t('delete')}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* EDIT DIALOG */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('editTitle')}</DialogTitle>
            <DialogDescription>{t('editSubtitle')}</DialogDescription>
          </DialogHeader>

          {editProduct && (
            <div className='space-y-4'>
              {/* IMAGE + Upload */}
              <div className='flex flex-col items-center gap-3'>
                <img
                  src={
                    editProduct.image_url ||
                    'https://placehold.co/150x150?text=No+Image'
                  }
                  alt='Product'
                  className='h-32 w-32 cursor-pointer rounded-md border object-cover hover:opacity-90'
                  onDoubleClick={() =>
                    editProduct.image_url &&
                    setImagePreview(editProduct.image_url)
                  }
                />

                {canManageProducts && (
                  <label className='text-primary flex cursor-pointer items-center gap-2 text-sm font-medium hover:underline'>
                    <Upload className='h-4 w-4' />
                    {t('changeImage')}
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
                )}
              </div>

              {/* EAN editierbar */}
              <div>
                <label className='text-sm font-medium'>{t('colEAN')}</label>
                <Input
                  value={editProduct.ean || ''}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, ean: e.target.value })
                  }
                  placeholder='EAN'
                  disabled={!canManageProducts}
                />
              </div>

              {/* Beschreibung */}
              <div>
                <label className='text-sm font-medium'>
                  {t('description')}
                </label>
                <Input
                  value={editProduct.beschreibung || ''}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      beschreibung: e.target.value
                    })
                  }
                  disabled={!canManageProducts}
                />
              </div>

              {/* Mindestbestand */}
              <div>
                <label className='text-sm font-medium'>{t('minStock')}</label>
                <Input
                  type='number'
                  value={editProduct.sollbestand || 0}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      sollbestand: +e.target.value
                    })
                  }
                  disabled={!canManageProducts}
                />
              </div>

              {/* BUTTONS */}
              <div className='flex justify-end gap-2'>
                <Button
                  variant='outline'
                  className='h-8 rounded-2xl px-4 text-sm font-medium'
                  onClick={() => setEditProduct(null)}
                >
                  {t('cancel')}
                </Button>

                <Button
                  className='border-border/30 text-foreground bg-muted/70 hover:bg-muted/90 relative h-8 rounded-2xl border px-4 text-sm font-medium transition-all duration-200 hover:text-emerald-500 hover:shadow-[0_0_10px_-2px_rgba(16,185,129,0.5)]'
                  onClick={handleSave}
                  disabled={!canManageProducts}
                >
                  {t('saveChanges')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* LOGS DIALOG */}
      <Dialog open={!!viewLogs} onOpenChange={() => setViewLogs(null)}>
        <DialogContent className='bg-background/90 w-full max-w-6xl rounded-2xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <DialogHeader className='px-7 pt-7'>
            <DialogTitle>{t('logTitle')}</DialogTitle>
            <DialogDescription>{t('logSubtitle')}</DialogDescription>
          </DialogHeader>

          {logsLoading ? (
            <div className='flex justify-center py-12'>
              <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
            </div>
          ) : logs.length === 0 ? (
            <p className='text-muted-foreground py-8 text-center text-sm'>
              {t('logEmpty')}
            </p>
          ) : (
            <div className='border-border/40 mt-3 max-h-[70vh] overflow-y-auto rounded-b-2xl border-t'>
              <Table className='min-w-full text-sm'>
                <TableHeader className='bg-background/90 sticky top-0 z-10 backdrop-blur-md'>
                  <TableRow>
                    <TableHead>{t('logDate')}</TableHead>
                    <TableHead>{t('logAction')}</TableHead>
                    <TableHead>{t('logQty')}</TableHead>
                    <TableHead>{t('logUser')}</TableHead>
                    <TableHead>{t('logDelivery')}</TableHead>
                    <TableHead>{t('logComment')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {logs.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(l.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>

                      <TableCell>
                        <Badge
                          className={
                            l.menge_diff >= 0
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-red-500/15 text-red-400'
                          }
                        >
                          {l.menge_diff >= 0 ? t('added') : t('removed')}
                        </Badge>
                      </TableCell>

                      <TableCell>{Math.abs(l.menge_diff)}</TableCell>
                      <TableCell>{l.benutzer || 'System'}</TableCell>

                      <TableCell>
                        {l.lieferscheinnr ? (
                          <span className='bg-primary/10 text-primary rounded-md px-2 py-[2px] font-mono text-xs'>
                            {l.lieferscheinnr}
                          </span>
                        ) : (
                          <span className='text-muted-foreground'>—</span>
                        )}
                      </TableCell>

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

      {/* IMAGE PREVIEW */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className='bg-background/90 max-w-3xl border-none p-0 shadow-2xl backdrop-blur-lg'>
          <VisuallyHidden>
            <DialogTitle>Image Preview</DialogTitle>
          </VisuallyHidden>

          {imagePreview && (
            <img
              src={imagePreview}
              alt='preview'
              className='h-auto w-full rounded-xl object-contain'
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
