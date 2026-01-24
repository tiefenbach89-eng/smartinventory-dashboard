'use client';

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

export default function ProductListing() {
  const t = useTranslations('ProductListing');
  const tCommon = useTranslations('common');
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
  const [userRole, setUserRole] = useState<string>('employee');
  const [editingLog, setEditingLog] = useState<any | null>(null);
  const [deleteLogTarget, setDeleteLogTarget] = useState<any | null>(null);

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('artikel').select('*');
      if (error) toast.error(t('errorLoadProducts'));
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
    loadUserRole();
  }, [supabase, t]);

  async function loadUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role);
      }
    }
  }

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

  // Save product
  async function handleSave() {
    if (!editProduct) return;
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

  // Delete product
  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      toast.loading(t('toastDeleting'));
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', deleteTarget.artikelnummer);

      if (error) throw error;

      setProducts(
        products.filter((p) => p.artikelnummer !== deleteTarget.artikelnummer)
      );

      toast.success(t('toastDeleted'));
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(t('toastDeleteFailed', { message: err.message }));
    } finally {
      toast.dismiss();
    }
  }

  // Load logs
  async function fetchLogs(articleNumber: string) {
    try {
      setLogsLoading(true);
      setViewLogs(articleNumber);

      const { data, error } = await supabase
        .from('artikel_log')
        .select(
          'id, timestamp, aktion, menge_diff, kommentar, benutzer, lieferscheinnr'
        )
        .eq('artikelnummer', articleNumber)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setLogs(data || []);
    } catch (err: any) {
      toast.error(t('toastLogFailed', { message: err.message }));
    } finally {
      setLogsLoading(false);
    }
  }

  // Edit log entry
  async function saveLogEdit() {
    if (!editingLog) return;

    try {
      const { error } = await supabase
        .from('artikel_log')
        .update({
          menge_diff: editingLog.menge_diff,
          kommentar: editingLog.kommentar,
          lieferscheinnr: editingLog.lieferscheinnr
        })
        .eq('id', editingLog.id);

      if (error) throw error;

      toast.success(tCommon('saved'));
      setEditingLog(null);
      if (viewLogs) fetchLogs(viewLogs);
    } catch (err: any) {
      toast.error(tCommon('error') + ': ' + err.message);
    }
  }

  // Delete log entry
  async function handleDeleteLog() {
    if (!deleteLogTarget) return;

    try {
      const { error } = await supabase
        .from('artikel_log')
        .delete()
        .eq('id', deleteLogTarget.id);

      if (error) throw error;

      toast.success(tCommon('deleted'));
      setDeleteLogTarget(null);
      if (viewLogs) fetchLogs(viewLogs);
    } catch (err: any) {
      toast.error(tCommon('error') + ': ' + err.message);
    }
  }

  return (
    <div className='w-full space-y-8 px-6 py-8 sm:px-8 md:px-12 md:py-12'>
      {/* iOS-Style Hero Header */}
      <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 backdrop-blur-xl'>
        <div className='absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]' />
        <div className='relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-3'>
            <h1 className='text-4xl font-black tracking-tight sm:text-5xl'>
              <span className='bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent'>
                {t('title')}
              </span>
            </h1>
            <p className='text-muted-foreground text-base font-medium'>
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* iOS-Style Filter Bar */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-xs rounded-xl border-2 bg-background/70 backdrop-blur-sm'
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size='default'
              variant='outline'
              className='group gap-2 rounded-xl border-2 bg-background px-4 py-2 font-bold transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg'
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

      {/* Products Grid */}
      {loading ? (
        <div className='flex justify-center py-12'>
          <Loader2 className='text-muted-foreground h-8 w-8 animate-spin' />
        </div>
      ) : filtered.length === 0 ? (
        <div className='relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-secondary/30 via-secondary/10 to-transparent p-20 text-center shadow-xl backdrop-blur-xl'>
          <div className='absolute inset-0 bg-grid-white/[0.02]' />
          <div className='relative'>
            <p className='text-muted-foreground text-lg font-medium'>{t('noProducts')}</p>
          </div>
        </div>
      ) : (
        <div className='grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-5'>
          {filtered.map((p) => {
            const stockPercentage = p.sollbestand > 0 ? (p.bestand / p.sollbestand) * 100 : 100;
            const isLowStock = p.bestand <= (p.sollbestand || 0);

            return (
              <Card
                key={p.artikelnummer}
                className='group relative flex flex-col overflow-hidden rounded-2xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 p-4 shadow-lg backdrop-blur-xl transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl'
              >
                {/* iOS-Style Gradient Overlay */}
                <div className='absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100'>
                  <div
                    className='absolute inset-0'
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${isLowStock ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)'} 0%, transparent 60%)`
                    }}
                  />
                </div>

                {/* Subtle Pattern Overlay */}
                <div className='absolute inset-0 -z-10 opacity-[0.02]'>
                  <div className='absolute inset-0 bg-grid-white [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))]' />
                </div>

                {/* Image */}
                {p.image_url ? (
                  <div className='mb-5 flex justify-center'>
                    <div className='relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/10 p-4 shadow-inner backdrop-blur-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-lg'>
                      <img
                        src={p.image_url}
                        alt={p.artikelbezeichnung}
                        className='h-32 w-auto max-w-full cursor-pointer object-contain drop-shadow-2xl'
                        onClick={() => setImagePreview(p.image_url)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className='mb-5 flex justify-center'>
                    <div className='flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-secondary/40 to-secondary/10 shadow-inner backdrop-blur-sm'>
                      <span className='text-muted-foreground text-xs font-semibold'>{t('noImage')}</span>
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className='mb-4 space-y-2'>
                  <div className='flex items-start justify-between gap-2'>
                    <h3 className='text-lg font-black tracking-tight'>{p.artikelbezeichnung}</h3>
                  </div>
                  <div className='inline-flex items-center rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 px-3 py-1.5 shadow-sm'>
                    <span className='text-primary text-xs font-black uppercase tracking-wide'>#{p.artikelnummer}</span>
                  </div>

                  {/* Supplier & Price */}
                  <div className='space-y-1 rounded-xl bg-gradient-to-r from-secondary/40 to-secondary/20 p-2.5 text-xs'>
                    {p.lieferant && (
                      <div className='flex items-center gap-1.5'>
                        <span className='text-muted-foreground font-medium'>Lieferant:</span>
                        <span className='font-bold'>{p.lieferant}</span>
                      </div>
                    )}
                    {p.preis && (
                      <div className='flex items-center gap-1.5'>
                        <span className='text-muted-foreground font-medium'>Preis:</span>
                        <span className='font-bold'>{p.preis.toFixed(2)} €</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {p.beschreibung && (
                    <div className='text-muted-foreground rounded-lg bg-gradient-to-r from-secondary/50 to-secondary/25 px-3 py-2 text-xs'>
                      <p className='line-clamp-2'>{p.beschreibung}</p>
                    </div>
                  )}
                </div>

                {/* Stock Level Visual */}
                <div className='mb-4 space-y-2'>
                  <div className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground font-medium'>Bestand</span>
                    <span className='font-black'>
                      {p.bestand} / {p.sollbestand || 0}
                    </span>
                  </div>
                  <div className='h-2 overflow-hidden rounded-full bg-secondary/30'>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        stockPercentage < 50 ? 'bg-red-500' : stockPercentage < 80 ? 'bg-orange-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                    />
                  </div>
                  {isLowStock && (
                    <Badge className='w-full justify-center rounded-lg border border-red-500/20 bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400'>
                      Niedriger Bestand
                    </Badge>
                  )}
                </div>

                {/* iOS-Style Action Buttons */}
                <div className='mt-auto space-y-2'>
                  <div className='flex gap-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      className='hover:bg-primary/10 hover:border-primary/50 flex-1 rounded-xl border-2 py-4 text-xs font-bold shadow-sm transition-all duration-300 hover:scale-105 hover:text-primary hover:shadow-lg'
                      onClick={() => setEditProduct(p)}
                    >
                      <Pencil className='mr-1.5 h-3.5 w-3.5' />
                      Bearbeiten
                    </Button>
                    <Button
                      size='sm'
                      variant='outline'
                      className='hover:bg-blue-500/10 hover:border-blue-500/50 flex-1 rounded-xl border-2 py-4 text-xs font-bold shadow-sm transition-all duration-300 hover:scale-105 hover:text-blue-600 hover:shadow-lg'
                      onClick={() => fetchLogs(p.artikelnummer)}
                    >
                      <History className='mr-1.5 h-3.5 w-3.5' />
                      Historie
                    </Button>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='text-destructive hover:bg-destructive/10 w-full rounded-xl py-2 text-xs font-bold transition-all duration-300 hover:scale-105 hover:text-destructive'
                        onClick={() => setDeleteTarget(p)}
                      >
                        <Trash2 className='mr-1.5 h-3.5 w-3.5' />
                        Löschen
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('deleteTitle')}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('deleteDescription')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete}>
                          {t('delete')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
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
              </div>

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
                />
              </div>

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
                />
              </div>

              <div className='flex justify-end gap-2'>
                <Button variant='outline' onClick={() => setEditProduct(null)}>
                  {t('cancel')}
                </Button>

                <Button onClick={handleSave}>{t('saveChanges')}</Button>
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
                    {userRole === 'admin' && <TableHead className='text-right'>Aktionen</TableHead>}
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

                      {userRole === 'admin' && (
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-1'>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='h-8 w-8 p-0'
                              onClick={() => setEditingLog(l)}
                            >
                              <Pencil className='h-3.5 w-3.5' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
                              onClick={() => setDeleteLogTarget(l)}
                            >
                              <Trash2 className='h-3.5 w-3.5' />
                            </Button>
                          </div>
                        </TableCell>
                      )}
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
          {imagePreview && (
            <img
              src={imagePreview}
              alt='preview'
              className='h-auto w-full rounded-xl object-contain'
            />
          )}
        </DialogContent>
      </Dialog>

      {/* EDIT LOG DIALOG */}
      {editingLog && (
        <Dialog open={!!editingLog} onOpenChange={() => setEditingLog(null)}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Eintrag bearbeiten</DialogTitle>
              <DialogDescription>Bearbeiten Sie den Historieneintrag</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium'>Menge</label>
                <Input
                  type='number'
                  value={editingLog.menge_diff}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      menge_diff: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>Lieferscheinnummer</label>
                <Input
                  value={editingLog.lieferscheinnr || ''}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      lieferscheinnr: e.target.value
                    })
                  }
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>Kommentar</label>
                <Input
                  value={editingLog.kommentar || ''}
                  onChange={(e) =>
                    setEditingLog({
                      ...editingLog,
                      kommentar: e.target.value
                    })
                  }
                />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setEditingLog(null)}
                >
                  {tCommon('cancel')}
                </Button>
                <Button onClick={saveLogEdit}>
                  {tCommon('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* DELETE LOG DIALOG */}
      <AlertDialog open={!!deleteLogTarget} onOpenChange={() => setDeleteLogTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Dieser Vorgang kann nicht rückgängig gemacht werden. Der Historieneintrag wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLog} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
