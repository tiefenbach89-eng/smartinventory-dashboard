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
      toast.error('Bitte gültige Menge eingeben');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userName = user?.email?.split('@')[0] || 'System';

      const newStock = bookingAction === 'add'
        ? bookingProduct.bestand + bookingAmount
        : bookingProduct.bestand - bookingAmount;

      if (newStock < 0) {
        toast.error('Nicht genügend Bestand vorhanden');
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
          aktion: bookingAction === 'add' ? 'Zugang' : 'Abgang',
          menge_diff: bookingAction === 'add' ? bookingAmount : -bookingAmount,
          benutzer: userName,
          kommentar: bookingComment || null,
          lieferscheinnr: bookingDeliveryNote || null
        });

      if (logError) throw logError;

      toast.success(bookingAction === 'add' ? 'Eingebucht' : 'Ausgebucht');
      setOpenBookingDialog(false);

      // Reload products
      const { data } = await supabase.from('artikel').select('*');
      setProducts(data || []);
    } catch (err: any) {
      toast.error('Fehler bei der Buchung: ' + err.message);
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

      {/* iOS CARD GRID */}
      <CardContent>
        {loading ? (
          <div className='flex justify-center py-6'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'>
            {filtered.map((p) => {
              const stockPercentage =
                p.sollbestand > 0 ? (p.bestand / p.sollbestand) * 100 : 100;
              const isLowStock = p.bestand <= (p.sollbestand || 0);

              return (
                <Card
                  key={p.artikelnummer}
                  className='group relative flex flex-col overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 p-4 shadow-lg backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl'
                >
                  {/* iOS-Style Gradient Overlay */}
                  <div className='bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />

                  {/* Stock Status Badge */}
                  <div className='absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 shadow-md backdrop-blur-md'>
                    {isLowStock ? (
                      <>
                        <AlertTriangle className='h-3.5 w-3.5 text-red-500' />
                        <span className='text-[10px] font-semibold text-red-500'>
                          {t('filterLow')}
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className='h-3.5 w-3.5 text-emerald-500' />
                        <span className='text-[10px] font-semibold text-emerald-500'>
                          {t('filterInstock')}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Product Image */}
                  <div className='relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-muted/30 to-muted/60'>
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.artikelbezeichnung}
                        className='h-full w-full cursor-pointer object-contain transition-all duration-500 group-hover:scale-110'
                        onDoubleClick={() => setImagePreview(p.image_url)}
                      />
                    ) : (
                      <div className='flex flex-col items-center justify-center gap-2 text-muted-foreground'>
                        <Package className='h-12 w-12 opacity-30' />
                        <span className='text-[10px] font-medium opacity-50'>
                          {t('noImage')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className='relative z-10 flex flex-1 flex-col gap-2'>
                    {/* Article Number */}
                    <div className='flex items-center gap-1.5'>
                      <div className='flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10'>
                        <span className='text-primary text-[10px] font-bold'>
                          #
                        </span>
                      </div>
                      <span className='text-muted-foreground truncate font-mono text-[11px] font-medium'>
                        {p.artikelnummer}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h4 className='line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight'>
                      {p.artikelbezeichnung}
                    </h4>

                    {/* Supplier & Price */}
                    <div className='flex items-center justify-between gap-2 border-t border-border/30 pt-2'>
                      <span className='text-muted-foreground truncate text-[11px] font-medium'>
                        {p.lieferant}
                      </span>
                      <span className='text-primary whitespace-nowrap text-sm font-bold'>
                        {p.preis?.toFixed(2)} €
                      </span>
                    </div>

                    {/* EAN */}
                    {p.ean && (
                      <div className='flex items-center gap-1.5'>
                        <span className='text-muted-foreground text-[10px] font-medium'>
                          EAN:
                        </span>
                        <span className='text-foreground/70 truncate font-mono text-[10px]'>
                          {p.ean}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {p.beschreibung && (
                      <p className='text-muted-foreground line-clamp-2 text-[11px] leading-relaxed'>
                        {p.beschreibung}
                      </p>
                    )}

                    {/* Stock Level Visual */}
                    <div className='mt-2 space-y-1.5'>
                      <div className='flex items-baseline justify-between'>
                        <span className='text-[11px] font-semibold'>
                          {t('colStock')}
                        </span>
                        <span
                          className={`text-xs font-bold ${
                            isLowStock
                              ? 'text-red-500'
                              : 'text-emerald-500'
                          }`}
                        >
                          {p.bestand} / {p.sollbestand || 0}
                        </span>
                      </div>
                      <Progress
                        value={Math.min(stockPercentage, 100)}
                        className='h-2'
                        indicatorClassName={
                          isLowStock
                            ? 'bg-gradient-to-r from-red-500 to-red-600'
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        }
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className='mt-3 space-y-2'>
                      {/* Booking Buttons Row */}
                      <div className='flex flex-col gap-1.5 lg:flex-row'>
                        {/* Einbuchen Button - Admin/Manager only */}
                        {canManageProducts && (
                          <Button
                            size='sm'
                            onClick={() => handleBooking(p, 'add')}
                            className='flex-1 rounded-xl bg-gradient-to-r from-green-500/10 to-green-600/10 px-3 py-1.5 text-[11px] font-semibold text-green-600 shadow-sm transition-all duration-300 hover:scale-105 hover:from-green-500/20 hover:to-green-600/20 hover:shadow-md dark:text-green-400'
                          >
                            <TrendingUp className='mr-1 h-3.5 w-3.5' />
                            Einbuchen
                          </Button>
                        )}
                        {/* Ausbuchen Button - Always visible */}
                        <Button
                          size='sm'
                          onClick={() => handleBooking(p, 'remove')}
                          className='flex-1 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 px-3 py-1.5 text-[11px] font-semibold text-orange-600 shadow-sm transition-all duration-300 hover:scale-105 hover:from-orange-500/20 hover:to-orange-600/20 hover:shadow-md dark:text-orange-400'
                        >
                          <TrendingDown className='mr-1 h-3.5 w-3.5' />
                          Ausbuchen
                        </Button>
                      </div>

                      {/* Management Buttons Row */}
                      <div className='flex flex-wrap gap-1.5'>
                      {/* History Button - Always visible */}
                      <Button
                        size='sm'
                        onClick={() => fetchLogs(p.artikelnummer)}
                        className='flex-1 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 px-3 py-1.5 text-[11px] font-semibold text-blue-600 shadow-sm transition-all duration-300 hover:scale-105 hover:from-blue-500/20 hover:to-blue-600/20 hover:shadow-md dark:text-blue-400'
                      >
                        <History className='mr-1 h-3.5 w-3.5' />
                        {t('logs')}
                      </Button>

                      {/* Edit Button - Admin/Manager only */}
                      {canManageProducts && (
                        <Button
                          size='sm'
                          onClick={() => setEditProduct(p)}
                          className='flex-1 rounded-xl bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 px-3 py-1.5 text-[11px] font-semibold text-yellow-600 shadow-sm transition-all duration-300 hover:scale-105 hover:from-yellow-500/20 hover:to-yellow-600/20 hover:shadow-md dark:text-yellow-400'
                        >
                          <Pencil className='mr-1 h-3.5 w-3.5' />
                          {t('edit')}
                        </Button>
                      )}

                      {/* Delete Button - Admin only */}
                      {canDeleteProducts && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size='sm'
                              onClick={() => setDeleteTarget(p)}
                              className='flex-1 rounded-xl bg-gradient-to-r from-red-500/10 to-red-600/10 px-3 py-1.5 text-[11px] font-semibold text-red-600 shadow-sm transition-all duration-300 hover:scale-105 hover:from-red-500/20 hover:to-red-600/20 hover:shadow-md dark:text-red-400'
                            >
                              <Trash2 className='mr-1 h-3.5 w-3.5' />
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
                    </div>
                  </div>
                </Card>
              );
            })}
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

      {/* BOOKING DIALOG */}
      <Dialog open={openBookingDialog} onOpenChange={() => setOpenBookingDialog(false)}>
        <DialogContent className='max-w-[95vw] sm:max-w-md'>
          <DialogHeader>
            <DialogTitle className='text-base sm:text-lg'>
              {bookingAction === 'add' ? 'Artikel einbuchen' : 'Artikel ausbuchen'}
            </DialogTitle>
            <DialogDescription className='text-xs sm:text-sm'>
              {bookingProduct?.artikelbezeichnung} (#{bookingProduct?.artikelnummer})
            </DialogDescription>
          </DialogHeader>

          {bookingProduct && (
            <div className='space-y-3 sm:space-y-4'>
              {/* Current Stock */}
              <div className='bg-muted/50 rounded-lg p-2.5 sm:p-3'>
                <div className='text-muted-foreground text-xs sm:text-sm'>Aktueller Bestand</div>
                <div className='text-xl font-bold sm:text-2xl'>{bookingProduct.bestand} Stück</div>
              </div>

              {/* Amount */}
              <div>
                <label className='text-xs font-medium sm:text-sm'>Menge</label>
                <Input
                  type='number'
                  min='1'
                  value={bookingAmount || ''}
                  onChange={(e) => setBookingAmount(Number(e.target.value))}
                  placeholder='Anzahl eingeben'
                  autoFocus={false}
                  inputMode='numeric'
                  className='text-base'
                />
              </div>

              {/* Delivery Note (only for add) */}
              {bookingAction === 'add' && (
                <div>
                  <label className='text-xs font-medium sm:text-sm'>Lieferschein-Nr.</label>
                  <Input
                    value={bookingDeliveryNote}
                    onChange={(e) => setBookingDeliveryNote(e.target.value)}
                    placeholder='Optional'
                    autoFocus={false}
                    className='text-base'
                  />
                </div>
              )}

              {/* Comment */}
              <div>
                <label className='text-xs font-medium sm:text-sm'>Kommentar</label>
                <Input
                  value={bookingComment}
                  onChange={(e) => setBookingComment(e.target.value)}
                  placeholder='Optional'
                  autoFocus={false}
                  className='text-base'
                />
              </div>

              {/* New Stock Preview */}
              {bookingAmount > 0 && (
                <div className='bg-muted/50 rounded-lg p-2.5 sm:p-3'>
                  <div className='text-muted-foreground text-xs sm:text-sm'>Neuer Bestand</div>
                  <div className={`text-xl font-bold sm:text-2xl ${
                    bookingAction === 'add' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {bookingAction === 'add'
                      ? bookingProduct.bestand + bookingAmount
                      : bookingProduct.bestand - bookingAmount} Stück
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
                  Abbrechen
                </Button>
                <Button
                  onClick={saveBooking}
                  className={`h-9 text-sm sm:h-10 ${
                    bookingAction === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  {bookingAction === 'add' ? 'Einbuchen' : 'Ausbuchen'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
