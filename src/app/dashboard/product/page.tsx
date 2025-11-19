'use client';

import { SquarePlus, SquareMinus, Boxes } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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

// EAN Validierung: 8 oder 13 Stellen
function isValidEAN(input: string | null | undefined) {
  if (!input) return false;
  const ean = input.replace(/\s/g, '');
  return ean.length === 8 || ean.length === 13;
}

// 🔥 Styles für animierte Scan-Linie & Scan-Rahmen
const scanStyles = `
  .scan-area {
    position: absolute;
    inset: 0.75rem;
    border: 2px solid rgba(255, 255, 255, 0.35);
    border-radius: 0.75rem;
    box-shadow: 0 0 0 9999px rgba(0,0,0,0.35);
    pointer-events: none;
    overflow: hidden;
  }

  .scan-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: rgba(16, 185, 129, 0.95);
    box-shadow: 0 0 12px rgba(16, 185, 129, 0.95);
    animation: scan-move 2s infinite;
  }

  @keyframes scan-move {
    0%   { top: 8%;  }
    50%  { top: 92%; }
    100% { top: 8%;  }
  }
`;

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
  const [eanAdd, setEanAdd] = useState('');
  const [eanRemove, setEanRemove] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Scanner Video
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraAvailable, setCameraAvailable] = useState(false);

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

  // Kamera-Fähigkeiten prüfen
  useEffect(() => {
    async function checkCam() {
      if (
        typeof navigator === 'undefined' ||
        !navigator.mediaDevices?.enumerateDevices
      ) {
        setCameraAvailable(false);
        return;
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasVideo = devices.some((d) => d.kind === 'videoinput');
        setCameraAvailable(hasVideo);
      } catch {
        setCameraAvailable(false);
      }
    }
    checkCam();
  }, []);

  const selected = products.find(
    (p) => String(p.artikelnummer) === selectedProduct
  );

  // ----------------------------------------------------------------------
  // EAN → Produkt auswählen
  // ----------------------------------------------------------------------
  async function findAndSelectProductByEAN(ean: string) {
    const trimmed = ean?.trim();
    if (!isValidEAN(trimmed)) return false;

    const { data, error } = await supabase
      .from('artikel')
      .select('*')
      .eq('ean', trimmed)
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
    if (!isValidEAN(eanAdd)) {
      toast.error(tAdd('searchDisabled'));
      return;
    }
    await findAndSelectProductByEAN(eanAdd);
  }

  async function handleEanSearchRemove() {
    if (!isValidEAN(eanRemove)) {
      toast.error(tRemove('searchDisabled'));
      return;
    }
    await findAndSelectProductByEAN(eanRemove);
  }

  // ----------------------------------------------------------------------
  // Kamera-Scan (Add / Remove) → inkl. Live-Vorschau + animierter Scan-Linie
  // ----------------------------------------------------------------------
  const startScan = async (mode: 'add' | 'remove') => {
    try {
      if (typeof window === 'undefined') return;

      if (!cameraAvailable) {
        toast.error(
          mode === 'add' ? tAdd('scanNoCamera') : tRemove('scanNoCamera')
        );
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error(
          mode === 'add' ? tAdd('scanNoCamera') : tRemove('scanNoCamera')
        );
        return;
      }

      setIsScanning(true);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();

      const result = await reader.decodeOnceFromVideoElement(videoRef.current!);

      stream.getTracks().forEach((track) => track.stop());
      setIsScanning(false);

      const scannedEAN = result.getText();

      if (mode === 'add') {
        setEanAdd(scannedEAN);
      } else {
        setEanRemove(scannedEAN);
      }

      await findAndSelectProductByEAN(scannedEAN);
    } catch (error) {
      console.error(error);
      toast.error(mode === 'add' ? tAdd('scanFailed') : tRemove('scanFailed'));
      setIsScanning(false);
    }
  };

  // ----------------------------------------------------------------------
  // Stock Änderung (Add / Remove)
  // ----------------------------------------------------------------------
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
          ? `${user?.user_metadata?.first_name ?? ''} ${user?.user_metadata?.last_name ?? ''}`.trim()
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
        })
      });

      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error || 'Unknown error');

      toast.success(
        type === 'add'
          ? tAdd('toastSuccess', { name: product.artikelbezeichnung })
          : tRemove('toastSuccess', { name: product.artikelbezeichnung })
      );

      // Reset
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

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------

  return (
    <PageContainer>
      <div className='w-full space-y-6 px-4 py-6 sm:px-6 md:px-10 md:py-10'>
        {/* 🔥 Scan-CSS einbinden (für beide Dialoge) */}
        <style>{scanStyles}</style>

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

        {/* ---------------------------- ADD STOCK DIALOG ---------------------------- */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{tAdd('title')}</DialogTitle>
              <DialogDescription>{tAdd('description')}</DialogDescription>
            </DialogHeader>

            {/* CAMERA LIVE PREVIEW + animierte Linie */}
            {isScanning && (
              <div className='border-border relative mb-3 overflow-hidden rounded-lg border'>
                <video
                  ref={videoRef}
                  className='h-64 w-full bg-black object-cover'
                  autoPlay
                  muted
                  playsInline
                />
                {/* Scan-Rahmen + Linie */}
                <div className='scan-area'>
                  <div className='scan-line' />
                </div>
                <div className='pointer-events-none absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded-md bg-black/60 px-2 py-1 text-center text-[11px] text-white'>
                  {tAdd('scanActiveText')}
                </div>
              </div>
            )}

            <div className='space-y-4'>
              {/* PRODUCT SELECT */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tAdd('productLabel')}
                </label>

                <Select
                  value={selectedProduct}
                  onValueChange={(value) => {
                    setSelectedProduct(value);
                    const found = products.find(
                      (p) => String(p.artikelnummer) === value
                    );
                    setEanAdd(found?.ean ?? '');
                  }}
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
              </div>

              {/* EAN FIELD */}
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

                  {/* SEARCH ICON mit STOP-Cursor wenn ungültig */}
                  <button
                    type='button'
                    onClick={handleEanSearchAdd}
                    className={[
                      'absolute inset-y-0 right-14 flex h-full w-10 items-center justify-center transition',
                      isValidEAN(eanAdd)
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'cursor-not-allowed opacity-30'
                    ].join(' ')}
                  >
                    <svg className='h-6 w-6' fill='none' stroke='currentColor'>
                      <path
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </button>

                  {/* BARCODE SCAN BUTTON mit STOP-Cursor wenn keine Kamera */}
                  <button
                    type='button'
                    onClick={() => cameraAvailable && startScan('add')}
                    className={[
                      'absolute inset-y-0 right-2 flex h-full w-10 items-center justify-center transition',
                      cameraAvailable
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'cursor-not-allowed opacity-30'
                    ].join(' ')}
                    aria-label='Scan EAN'
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
                    className='h-44 w-44 rounded-xl border object-cover shadow-lg'
                  />
                </div>
              )}

              {/* REST FIELDS */}
              <div className='grid gap-4'>
                <div>
                  <label className='block text-sm font-medium'>
                    {tAdd('quantity')}
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium'>
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
                  <label className='block text-sm font-medium'>
                    {tAdd('deliveryNote')}
                  </label>
                  <Input
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium'>
                    {tAdd('note')}
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* SAVE BUTTON */}
              <div className='flex justify-end pt-2'>
                <Button size='sm' onClick={() => handleStockChange('add')}>
                  {loading ? tAdd('saving') : tAdd('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ---------------------------- REMOVE DIALOG ---------------------------- */}
        <Dialog open={openRemove} onOpenChange={setOpenRemove}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle>{tRemove('title')}</DialogTitle>
              <DialogDescription>{tRemove('description')}</DialogDescription>
            </DialogHeader>

            {/* Camera Preview + animierte Linie */}
            {isScanning && (
              <div className='relative mb-3 overflow-hidden rounded-lg border'>
                <video
                  ref={videoRef}
                  className='h-64 w-full bg-black object-cover'
                  autoPlay
                  muted
                  playsInline
                />
                <div className='scan-area'>
                  <div className='scan-line' />
                </div>
                <div className='pointer-events-none absolute bottom-2 left-1/2 w-[90%] -translate-x-1/2 rounded-md bg-black/60 px-2 py-1 text-center text-[11px] text-white'>
                  {tRemove('scanActiveText')}
                </div>
              </div>
            )}

            <div className='space-y-4'>
              {/* PRODUCT SELECT */}
              <div>
                <label className='mb-1 block text-sm font-medium'>
                  {tRemove('productLabel')}
                </label>

                <Select
                  value={selectedProduct}
                  onValueChange={(value) => {
                    setSelectedProduct(value);
                    const found = products.find(
                      (p) => String(p.artikelnummer) === value
                    );
                    setEanRemove(found?.ean ?? '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tRemove('placeholderProduct')} />
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
              </div>

              {/* EAN REMOVE */}
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

                  {/* SEARCH ICON mit STOP-Cursor */}
                  <button
                    type='button'
                    onClick={handleEanSearchRemove}
                    className={[
                      'absolute inset-y-0 right-14 flex h-full w-10 items-center justify-center transition',
                      isValidEAN(eanRemove)
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'cursor-not-allowed opacity-30'
                    ].join(' ')}
                  >
                    <svg className='h-6 w-6' fill='none' stroke='currentColor'>
                      <path
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                      />
                    </svg>
                  </button>

                  {/* SCAN BUTTON mit STOP-Cursor */}
                  <button
                    type='button'
                    onClick={() => cameraAvailable && startScan('remove')}
                    className={[
                      'absolute inset-y-0 right-2 flex h-full w-10 items-center justify-center transition',
                      cameraAvailable
                        ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                        : 'cursor-not-allowed opacity-30'
                    ].join(' ')}
                    aria-label='Scan EAN'
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
                    className='h-44 w-44 rounded-xl border object-cover shadow-lg'
                  />
                </div>
              )}

              {/* REST */}
              <div className='grid gap-4'>
                <div>
                  <label className='block text-sm font-medium'>
                    {tRemove('quantity')}
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium'>
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
