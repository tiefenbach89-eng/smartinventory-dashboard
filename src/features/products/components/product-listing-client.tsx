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

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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

import {
  Loader2,
  Pencil,
  History,
  Trash2,
  Upload,
  Filter,
  Package,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

// 🔐 Neu: Props für Permissions (wird von ProductsPage übergeben)
type ProductListingProps = {
  canManageProducts?: boolean; // Admin/Manager = true, Employee = false
  canDeleteProducts?: boolean; // Admin = true, Manager/Employee = false
};

export default function ProductListing({
  canManageProducts = false,
  canDeleteProducts = false
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

  // Booking state
  const [bookingProduct, setBookingProduct] = useState<any | null>(null);
  const [bookingAction, setBookingAction] = useState<'add' | 'remove'>('add');
  const [bookingAmount, setBookingAmount] = useState<number>(0);
  const [bookingComment, setBookingComment] = useState('');
  const [bookingDeliveryNote, setBookingDeliveryNote] = useState('');
  const [openBookingDialog, setOpenBookingDialog] = useState(false);

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
  // HANDLE BOOKING
  // ----------------------------------------------------------------------------------------------------
  function handleBooking(product: any, action: 'add' | 'remove') {
    setBookingProduct(product);
    setBookingAction(action);
    setBookingAmount(0);
    setBookingComment('');
    setBookingDeliveryNote('');
    setOpenBookingDialog(true);
  }

  async function saveBooking() {
    if (!bookingProduct || bookingAmount <= 0) {
      toast.error(t('bookingInvalidAmount'));
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || 'System';

      const newStock = bookingAction === 'add'
        ? bookingProduct.bestand + bookingAmount
        : bookingProduct.bestand - bookingAmount;

      if (newStock < 0) {
        toast.error(t('bookingInsufficientStock'));
        return;
      }

      // Update stock
      const { error: updateError } = await supabase
        .from('artikel')
        .update({ bestand: newStock })
        .eq('artikelnummer', bookingProduct.artikelnummer);

      if (updateError) throw updateError;

      // Log transaction
      const { error: logError } = await supabase
        .from('artikel_log')
        .insert({
          artikelnummer: bookingProduct.artikelnummer,
          artikelname: bookingProduct.artikelbezeichnung,
          aktion: bookingAction === 'add' ? 'Zugang' : 'Abgang',
          menge_diff: bookingAction === 'add' ? bookingAmount : -bookingAmount,
          benutzer: userName,
          kommentar: bookingComment || null,
          lieferscheinnr: bookingDeliveryNote || null
        });

      if (logError) throw logError;

      toast.success(t(bookingAction === 'add' ? 'bookingSuccessIn' : 'bookingSuccessOut'));
      setOpenBookingDialog(false);

      // Reload products
      const { data } = await supabase.from('artikel').select('*');
      setProducts(data || []);
    } catch (err: any) {
      toast.error(t('bookingFailed', { message: err.message }));
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
    <div className='w-full'>

      {/* ── Page Header ── */}
      <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-bold tracking-tight'>{t('title')}</h1>
          <p className='text-muted-foreground mt-0.5 text-sm'>{t('subtitle')}</p>
        </div>
        <div className='flex items-center gap-2'>
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='h-9 w-full max-w-[220px] text-sm'
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size='sm' variant='outline' className='h-9 gap-2 shrink-0'>
                <Filter className='h-3.5 w-3.5' />
                {t('filter')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-36'>
              <DropdownMenuLabel>{t('filterTitle')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>{t('filterAll')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('instock')}>{t('filterInstock')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('low')}>{t('filterLow')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Product Grid ── */}
      {loading ? (
        <div className='flex justify-center py-16'>
          <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-20 text-center'>
          <Package className='text-muted-foreground/30 mb-3 h-14 w-14' />
          <p className='text-muted-foreground text-sm'>{t('noImage')}</p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
          {filtered.map((p) => {
            const stockPercentage = p.sollbestand > 0 ? (p.bestand / p.sollbestand) * 100 : 100;
            const isLowStock = p.bestand <= (p.sollbestand || 0);

            return (
              <div
                key={p.artikelnummer}
                className='group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-border/40'
              >
                {/* ── Image pane — always white bg for clean product photos ── */}
                <div className='relative flex h-40 items-center justify-center bg-white'>
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.artikelbezeichnung}
                      className='h-full w-full cursor-zoom-in object-contain p-4 transition-transform duration-300 group-hover:scale-105'
                      onDoubleClick={() => setImagePreview(p.image_url)}
                    />
                  ) : (
                    <div className='flex flex-col items-center gap-2'>
                      <Package className='h-10 w-10 text-gray-200' />
                    </div>
                  )}

                  {/* Status badge — pill style */}
                  <div className='absolute left-2.5 top-2.5'>
                    {isLowStock ? (
                      <span className='inline-flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm'>
                        <AlertTriangle className='h-2.5 w-2.5' />
                        {t('filterLow')}
                      </span>
                    ) : (
                      <span className='inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur-sm'>
                        <CheckCircle2 className='h-2.5 w-2.5' />
                        {t('filterInstock')}
                      </span>
                    )}
                  </div>

                  {/* Icon actions — top right, visible on hover */}
                  <div className='absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100'>
                    <button
                      onClick={() => fetchLogs(p.artikelnummer)}
                      className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70'
                      title={t('logTitle')}
                    >
                      <History className='h-3.5 w-3.5' />
                    </button>
                    {canManageProducts && (
                      <button
                        onClick={() => setEditProduct(p)}
                        className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70'
                        title={t('editTitle')}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </button>
                    )}
                    {canDeleteProducts && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            className='flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-red-600/80'
                            title={t('deleteTitle')}
                          >
                            <Trash2 className='h-3.5 w-3.5' />
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>{t('deleteDescription')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete}>{t('delete')}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>

                {/* ── Info body ── */}
                <div className='flex flex-1 flex-col gap-3 p-3.5'>
                  {/* Article nr + supplier */}
                  <div className='flex items-center justify-between gap-1'>
                    <span className='font-mono text-[10px] text-muted-foreground'>#{p.artikelnummer}</span>
                    <span className='truncate text-right text-[10px] text-muted-foreground'>{p.lieferant}</span>
                  </div>

                  {/* Product name */}
                  <h4 className='line-clamp-2 text-sm font-semibold leading-snug'>
                    {p.artikelbezeichnung}
                  </h4>

                  {/* Price + EAN row */}
                  <div className='flex items-end justify-between gap-2'>
                    {p.ean ? (
                      <span className='font-mono text-[10px] text-muted-foreground'>EAN {p.ean}</span>
                    ) : (
                      <span />
                    )}
                    <span className='font-numeric shrink-0 text-base font-bold tabular-nums'>
                      {p.preis?.toFixed(2)} €
                    </span>
                  </div>

                  {/* Stock bar */}
                  <div className='space-y-1.5'>
                    <div className='flex items-center justify-between text-[11px]'>
                      <span className='text-muted-foreground'>{t('colStock')}</span>
                      <span className={`font-semibold tabular-nums ${isLowStock ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {p.bestand} / {p.sollbestand || '—'}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(stockPercentage, 100)}
                      className='h-1.5 rounded-full bg-muted'
                      indicatorClassName={`rounded-full transition-all ${isLowStock ? 'bg-red-500' : 'bg-primary'}`}
                    />
                  </div>

                  {/* ── Action buttons ── */}
                  <div className='mt-auto grid grid-cols-2 gap-1.5 border-t border-border/40 pt-3'>
                    <button
                      onClick={() => handleBooking(p, 'add')}
                      className='flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 px-2 py-2 text-[11px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20 dark:text-emerald-400'
                    >
                      <TrendingUp className='h-3.5 w-3.5' />
                      {t('bookIn')}
                    </button>
                    <button
                      onClick={() => handleBooking(p, 'remove')}
                      className='flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 px-2 py-2 text-[11px] font-semibold text-rose-700 transition-colors hover:bg-rose-500/20 dark:text-rose-400'
                    >
                      <TrendingDown className='h-3.5 w-3.5' />
                      {t('bookOut')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                  className='h-32 w-32 cursor-pointer rounded-md border object-contain hover:opacity-90'
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
                          variant='outline'
                          className={
                            l.menge_diff >= 0
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400'
                              : 'border-red-200 bg-red-50 text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400'
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

      {/* BOOKING DIALOG */}
      <Dialog open={openBookingDialog} onOpenChange={() => setOpenBookingDialog(false)}>
        <DialogContent className='max-w-[95vw] sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg'>
              {bookingAction === 'add' ? t('bookIn') : t('bookOut')}
            </DialogTitle>
            <DialogDescription className='text-xs sm:text-sm'>
              {bookingProduct?.artikelbezeichnung} (#{bookingProduct?.artikelnummer})
            </DialogDescription>
          </DialogHeader>

          {bookingProduct && (
            <div className='space-y-3 sm:space-y-4'>
              {/* Current Stock */}
              <div className='bg-muted/50 rounded-lg p-2.5 sm:p-3'>
                <div className='text-muted-foreground text-xs sm:text-sm'>{t('currentStock')}</div>
                <div className='text-xl font-bold sm:text-2xl'>{bookingProduct.bestand} {t('pieces')}</div>
              </div>

              {/* Amount */}
              <div>
                <label className='text-xs font-medium sm:text-sm'>{t('amount')}</label>
                <Input
                  type='number'
                  min='1'
                  value={bookingAmount || ''}
                  onChange={(e) => setBookingAmount(Number(e.target.value))}
                  placeholder={t('enterAmount')}
                  autoFocus={false}
                  inputMode='numeric'
                  className='text-base'
                />
              </div>

              {/* Delivery Note (only for add) */}
              {bookingAction === 'add' && (
                <div>
                  <label className='text-xs font-medium sm:text-sm'>{t('deliveryNote')}</label>
                  <Input
                    value={bookingDeliveryNote}
                    onChange={(e) => setBookingDeliveryNote(e.target.value)}
                    placeholder={t('optional')}
                    autoFocus={false}
                    className='text-base'
                  />
                </div>
              )}

              {/* Comment */}
              <div>
                <label className='text-xs font-medium sm:text-sm'>{t('comment')}</label>
                <Input
                  value={bookingComment}
                  onChange={(e) => setBookingComment(e.target.value)}
                  placeholder={t('optional')}
                  autoFocus={false}
                  className='text-base'
                />
              </div>

              {/* New Stock Preview */}
              {bookingAmount > 0 && (
                <div className='bg-muted/50 rounded-lg p-2.5 sm:p-3'>
                  <div className='text-muted-foreground text-xs sm:text-sm'>{t('newStock')}</div>
                  <div className={`text-xl font-bold sm:text-2xl ${
                    bookingAction === 'add' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {bookingAction === 'add'
                      ? bookingProduct.bestand + bookingAmount
                      : bookingProduct.bestand - bookingAmount} {t('pieces')}
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className='flex justify-end gap-2 pt-2'>
                <Button
                  variant='outline'
                  onClick={() => setOpenBookingDialog(false)}
                  className='h-9 text-sm sm:h-10'
                >
                  {t('cancel')}
                </Button>
                <Button
                  onClick={saveBooking}
                  variant={bookingAction === 'add' ? 'default' : 'outline'}
                  className='h-9 text-sm sm:h-10'
                >
                  {bookingAction === 'add' ? t('bookIn') : t('bookOut')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
