'use client';

import { SquarePlus, SquareMinus, Boxes } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageContainer from '@/components/layout/page-container';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import ProductListing from '@/features/products/components/product-listing-client';
import { CardModern } from '@/components/ui/card-modern';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

export default function ProductsPage() {
  const supabase = createClient();

  // 🌍 translations
  const p = useTranslations('Products');
  const tAdd = useTranslations('StockAdd');
  const tRemove = useTranslations('StockRemove');

  const [mounted, setMounted] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('' as any);
  const [price, setPrice] = useState<number | ''>('' as any);
  const [note, setNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [eanAdd, setEanAdd] = useState(''); // EAN im Add-Dialog
  const [eanRemove, setEanRemove] = useState(''); // EAN im Remove-Dialog
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, [supabase]);

  useEffect(() => {
    supabase
      .from('artikel')
      .select('*')
      .order('artikelbezeichnung', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data);
      });
  }, [supabase]);

  const selected = products.find(
    (p) => String(p.artikelnummer) === selectedProduct
  );

  // ------------------------------------------------------------------
  // EAN → Produkt automatisch auswählen
  // ------------------------------------------------------------------
  async function findAndSelectProductByEAN(ean: string) {
    if (!ean || ean.trim().length < 3) return false;

    const { data, error } = await supabase
      .from('artikel')
      .select('*')
      .eq('ean', ean.trim())
      .single();

    if (error || !data) {
      toast.error(tAdd('errorNotFound'));
      return false;
    }

    setSelectedProduct(String(data.artikelnummer));
    toast.success(data.artikelbezeichnung);
    return true;
  }

  async function handleEanSearchAdd() {
    await findAndSelectProductByEAN(eanAdd);
  }

  async function handleEanSearchRemove() {
    await findAndSelectProductByEAN(eanRemove);
  }

  // ------------------------------------------------------------------
  // Kamera-Scan für EAN (Add / Remove)
  // ------------------------------------------------------------------
  const startScan = async (mode: 'add' | 'remove') => {
    try {
      // Sicherstellen, dass wir im Browser sind
      if (typeof window === 'undefined') return;

      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();

      // ❗ KEINE Geräte-Liste mehr – wir nehmen die Standard-Kamera
      const result = await reader.decodeOnceFromVideoDevice(undefined);

      if (result) {
        const scanned = result.getText();

        if (mode === 'add') {
          setEanAdd(scanned);
        } else {
          setEanRemove(scanned);
        }

        await findAndSelectProductByEAN(scanned);
      } else {
        toast.error('Scan fehlgeschlagen.');
      }

      // reset() existiert zur Laufzeit, aber nicht im Typ -> vorsichtig casten
      (reader as any).reset?.();
    } catch (e) {
      console.error(e);
      toast.error('Scan fehlgeschlagen.');
    }
  };

  async function handleStockChange(type: 'add' | 'remove') {
    try {
      setLoading(true);
      if (!selectedProduct)
        throw new Error(
          type === 'add' ? tAdd('errorSelect') : tRemove('errorSelect')
        );
      if (!quantity || quantity <= 0)
        throw new Error(
          type === 'add' ? tAdd('errorQuantity') : tRemove('errorQuantity')
        );

      const product = selected;
      if (!product)
        throw new Error(
          type === 'add' ? tAdd('errorNotFound') : tRemove('errorNotFound')
        );

      const newStock =
        type === 'add'
          ? product.bestand + +quantity
          : product.bestand - +quantity;

      if (newStock < 0) throw new Error(tRemove('errorInsufficient'));

      const benutzer =
        user?.user_metadata?.first_name || user?.user_metadata?.last_name
          ? `${user?.user_metadata?.first_name ?? ''} ${
              user?.user_metadata?.last_name ?? ''
            }`.trim()
          : (user?.email ?? 'System');

      const res = await fetch('/api/stock-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artikelnummer: product.artikelnummer,
          artikelname: product.artikelbezeichnung,
          alt_wert: product.bestand,
          neu_wert: newStock,
          menge_diff: type === 'add' ? +quantity : -quantity,
          preis_snapshot: price || product.preis,
          aktion: type === 'add' ? 'addition' : 'removal',
          kommentar: note,
          lieferant: product.lieferant,
          benutzer,
          lieferscheinnr: type === 'add' ? deliveryNote || null : null
          // Optional:
          // ean: type === 'add' ? eanAdd || null : eanRemove || null
        })
      });

      const json = await res.json();
      if (!res.ok || json.error)
        throw new Error(json.error || 'Failed to save log entry');

      toast.success(
        type === 'add'
          ? tAdd('toastSuccess', { name: product.artikelbezeichnung })
          : tRemove('toastSuccess', { name: product.artikelbezeichnung })
      );

      setSelectedProduct('');
      setQuantity('');
      setPrice('');
      setNote('');
      setDeliveryNote('');
      if (type === 'add') {
        setEanAdd('');
        setOpenAdd(false);
      } else {
        setEanRemove('');
        setOpenRemove(false);
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleListProduct() {
    window.location.href = '/dashboard/product/new';
  }

  if (!mounted) return null;

  return (
    <PageContainer>
      <div className='w-full space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-10'>
        {/* Title */}
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <h2 className='text-center text-xl font-bold tracking-tight sm:text-left sm:text-2xl'>
            {p('title')}
          </h2>
        </div>

        {/* Tabs */}
        <Tabs defaultValue='add' className='w-full'>
          <TabsList className='bg-card/25 border-border/10 flex h-auto w-full flex-wrap items-center justify-center gap-2 rounded-3xl border px-2 py-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md sm:h-11 sm:w-fit sm:flex-nowrap sm:py-0'>
            {/* Add Stock */}
            <TabsTrigger
              value='add'
              onClick={() => setOpenAdd(true)}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 data-[state=active]:shadow-[0_0_15px_-3px_rgba(52,211,153,0.35)]'
            >
              <SquarePlus className='h-4 w-4 group-hover:text-emerald-400' />
              {p('tabAdd')}
            </TabsTrigger>

            {/* Remove Stock */}
            <TabsTrigger
              value='remove'
              onClick={() => setOpenRemove(true)}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 data-[state=active]:shadow-[0_0_15px_-3px_rgba(239,68,68,0.35)]'
            >
              <SquareMinus className='h-4 w-4 group-hover:text-red-400' />
              {p('tabRemove')}
            </TabsTrigger>

            {/* List Product */}
            <TabsTrigger
              value='list'
              onClick={handleListProduct}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 data-[state=active]:shadow-[0_0_15px_-3px_rgba(96,165,250,0.35)]'
            >
              <Boxes className='h-4 w-4 group-hover:text-sky-400' />
              {p('tabList')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Product Listing */}
        <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
          <ProductListing />
        </CardModern>

        {/* ADD STOCK DIALOG */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{tAdd('title')}</DialogTitle>
              <DialogDescription>{tAdd('description')}</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* PRODUCT SELECT */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tAdd('productLabel')}
                </label>

                {mounted && (
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={tAdd('placeholderProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.artikelnummer}
                          value={String(p.artikelnummer)}
                        >
                          {p.artikelbezeichnung} ({p.artikelnummer})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* EAN FIELD – FULL WIDTH */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tAdd('eanLabel')}
                </label>

                <div className='relative flex items-center'>
                  <Input
                    value={eanAdd}
                    onChange={(e) => setEanAdd(e.target.value)}
                    placeholder={tAdd('eanPlaceholder')}
                    className='pr-24'
                  />

                  {/* SEARCH ICON */}
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-14 flex h-full w-10 items-center justify-center'
                    onClick={handleEanSearchAdd}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-6 w-6'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      fill='none'
                    >
                      <path
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </button>

                  {/* BARCODE ICON */}
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex h-full w-10 items-center justify-center'
                    onClick={() => startScan('add')}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className='h-7 w-7'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M4 5h1v14H4V5Zm15 0h1v14h-1V5ZM7 9h1v6H7V9Zm4 0h1v6h-1V9Zm4 0h1v6h-1V9Z' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* IMAGE PREVIEW */}
              {selected?.image_url && (
                <div className='flex justify-center'>
                  <img
                    src={selected.image_url}
                    alt={selected.artikelbezeichnung}
                    className='h-32 w-32 rounded-md border object-cover shadow-sm'
                  />
                </div>
              )}

              {/* REST */}
              <div className='grid gap-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tAdd('quantity')}
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tAdd('price')}
                  </label>
                  <Input
                    type='number'
                    step='0.01'
                    value={price}
                    onChange={(e) => setPrice(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tAdd('deliveryNote')}
                  </label>
                  <Input
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tAdd('note')}
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className='flex justify-end pt-2'>
                <Button size='sm' onClick={() => handleStockChange('add')}>
                  {loading ? tAdd('saving') : tAdd('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* REMOVE STOCK DIALOG */}
        <Dialog open={openRemove} onOpenChange={setOpenRemove}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{tRemove('title')}</DialogTitle>
              <DialogDescription>{tRemove('description')}</DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {/* PRODUCT SELECT */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tRemove('productLabel')}
                </label>

                {mounted && (
                  <Select
                    value={selectedProduct}
                    onValueChange={setSelectedProduct}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={tRemove('placeholderProduct')}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem
                          key={p.artikelnummer}
                          value={String(p.artikelnummer)}
                        >
                          {p.artikelbezeichnung} ({p.artikelnummer})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* EAN FIELD FULL WIDTH */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tRemove('eanLabel')}
                </label>

                <div className='relative flex items-center'>
                  <Input
                    value={eanRemove}
                    onChange={(e) => setEanRemove(e.target.value)}
                    placeholder={tRemove('eanPlaceholder')}
                    className='pr-24'
                  />

                  {/* SEARCH */}
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-14 flex h-full w-10 items-center justify-center'
                    onClick={handleEanSearchRemove}
                  >
                    <svg
                      className='h-6 w-6'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </button>

                  {/* BARCODE ICON */}
                  <button
                    type='button'
                    className='text-muted-foreground hover:text-foreground absolute inset-y-0 right-2 flex h-full w-10 items-center justify-center'
                    onClick={() => startScan('remove')}
                  >
                    <svg
                      className='h-7 w-7'
                      viewBox='0 0 24 24'
                      fill='currentColor'
                    >
                      <path d='M4 5h1v14H4V5Zm15 0h1v14h-1V5ZM7 9h1v6H7V9Zm4 0h1v6h-1V9Zm4 0h1v6h-1V9Z' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* IMAGE */}
              {selected?.image_url && (
                <div className='flex justify-center'>
                  <img
                    src={selected.image_url}
                    alt={selected.artikelbezeichnung}
                    className='h-32 w-32 rounded-md border object-cover shadow-sm'
                  />
                </div>
              )}

              {/* REST */}
              <div className='grid gap-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tRemove('quantity')}
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    {tRemove('note')}
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className='flex justify-end pt-2'>
                <Button size='sm' onClick={() => handleStockChange('remove')}>
                  {loading ? tRemove('saving') : tRemove('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
