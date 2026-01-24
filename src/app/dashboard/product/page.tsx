'use client';

import { SquarePlus, SquareMinus, Boxes } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
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
import { useRolePermissions } from '@/hooks/useRolePermissions';

// 🌍 next-intl
import { useTranslations } from 'next-intl';

// EAN Validierung: 8 oder 13 Stellen
function isValidEAN(input: string | null | undefined) {
  if (!input) return false;
  const ean = input.replace(/\s/g, '');
  return ean.length === 8 || ean.length === 13;
}

export default function ProductsPage() {
  const supabase = createClient();
  const { permissions } = useRolePermissions();

  // 🌍 translations
  const p = useTranslations('Products');
  const tAdd = useTranslations('StockAdd');
  const tRemove = useTranslations('StockRemove');

  const canManageProducts = permissions?.can_manage_products;
  const canStockInOut = permissions?.can_adjust_stock;

  const [mounted, setMounted] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [eanAdd, setEanAdd] = useState('');
  const [eanRemove, setEanRemove] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Kamera / Scanner
  const [cameraAvailable, setCameraAvailable] = useState(false);
  const [scannerMode, setScannerMode] = useState<'add' | 'remove' | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
  // Fullscreen-Scanner (Add / Remove)
  // ----------------------------------------------------------------------
  const closeScanner = () => {
    setScannerOpen(false);
    setScannerMode(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openScanner = (mode: 'add' | 'remove') => {
    if (!cameraAvailable || !navigator.mediaDevices?.getUserMedia) {
      toast.error(
        mode === 'add' ? tAdd('scanNoCamera') : tRemove('scanNoCamera')
      );
      return;
    }
    setScannerMode(mode);
    setScannerOpen(true);
  };

  useEffect(() => {
    if (!scannerOpen || !scannerMode) return;

    let cancelled = false;

    async function startScan() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const reader = new BrowserMultiFormatReader();

        const result = await reader.decodeOnceFromVideoElement(
          videoRef.current!
        );
        if (cancelled) return;

        const scannedEAN = result.getText();

        if (scannerMode === 'add') {
          setEanAdd(scannedEAN);
        } else {
          setEanRemove(scannedEAN);
        }

        await findAndSelectProductByEAN(scannedEAN);
        closeScanner();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        toast.error(
          scannerMode === 'add' ? tAdd('scanFailed') : tRemove('scanFailed')
        );
        closeScanner();
      }
    }

    startScan();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [scannerOpen, scannerMode]);

  // ----------------------------------------------------------------------
  // Stock Änderung (Add / Remove)
  // ----------------------------------------------------------------------
  async function handleStockChange(type: 'add' | 'remove') {
    try {
      if (!canStockInOut) {
        toast.error(p('noPermission'));
        return;
      }

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
          menge_diff: type === 'add' ? +quantity : -+quantity,
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
    if (!canManageProducts) {
      toast.error(p('noPermission'));
      return;
    }
    window.location.href = '/dashboard/product/new';
  }

  if (!mounted) return null;

  // ----------------------------------------------------------------------
  // RENDER
  // ----------------------------------------------------------------------

  return (
    <PageContainer>
      <div className='w-full space-y-8 px-6 py-8 sm:px-8 md:px-12 md:py-12'>
        {/* iOS-Style Hero Header */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 backdrop-blur-xl'>
          <div className='absolute inset-0 bg-grid-white/[0.02] [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]' />
          <div className='relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between'>
            <div className='space-y-3'>
              <div className='inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 backdrop-blur-sm'>
                <Boxes className='h-4 w-4 text-primary' />
                <span className='text-xs font-semibold uppercase tracking-wider text-primary'>
                  Produkt Management
                </span>
              </div>
              <h1 className='text-4xl font-black tracking-tight sm:text-5xl'>
                <span className='bg-gradient-to-r from-foreground via-foreground/80 to-foreground/60 bg-clip-text text-transparent'>
                  {p('title')}
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* iOS-Style Action Buttons */}
        <div className='flex flex-wrap items-center gap-3'>
          {/* List Product Button – nur Admin/Manager */}
          {canManageProducts && (
            <Button
              variant='outline'
              size='default'
              onClick={handleListProduct}
              className='group gap-2 rounded-xl border-2 bg-background px-4 py-2 font-bold transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-primary/10 hover:shadow-lg'
            >
              <Boxes className='h-4 w-4' />
              Artikel hinzufügen
            </Button>
          )}
        </div>

        {/* iOS-Style Product Listing */}
        <CardModern className='relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-background via-background to-secondary/20 p-6 shadow-xl backdrop-blur-xl sm:p-8'>
          <div className='absolute inset-0 bg-grid-white/[0.02]' />
          <div className='relative space-y-8'>
            <ProductListing canManageProducts={!!canManageProducts} />
          </div>
        </CardModern>

        {/* ---------------------------- ADD STOCK DIALOG ---------------------------- */}
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
                    onClick={() => cameraAvailable && openScanner('add')}
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
                <Button
                  size='sm'
                  onClick={() => handleStockChange('add')}
                  disabled={!canStockInOut}
                >
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
                    onClick={() => cameraAvailable && openScanner('remove')}
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
                <Button
                  size='sm'
                  onClick={() => handleStockChange('remove')}
                  disabled={!canStockInOut}
                >
                  {loading ? tRemove('saving') : tRemove('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 🔍 FULLSCREEN SCANNER OVERLAY */}
        {scannerOpen && (
          <div className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 text-white'>
            <button
              onClick={closeScanner}
              className='absolute top-4 right-4 rounded-md bg-white/20 px-3 py-1 text-sm'
              aria-label='Close scanner'
            >
              ✕
            </button>

            <div className='relative w-full max-w-xl px-4'>
              <video
                ref={videoRef}
                className='h-[60vh] w-full rounded-2xl object-cover'
                autoPlay
                muted
                playsInline
              />

              {/* Rahmen */}
              <div className='pointer-events-none absolute inset-6 rounded-2xl border-2 border-white/40' />

              {/* Scan-Linie */}
              <div className='animate-scan absolute top-1/3 right-10 left-10 h-[3px] bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.9)]' />
            </div>

            <p className='mt-4 text-sm text-white/80'>
              {scannerMode === 'add'
                ? tAdd('scanActiveText')
                : tRemove('scanActiveText')}
            </p>

            <style>{`
              @keyframes scan {
                0% { transform: translateY(0); }
                50% { transform: translateY(160px); }
                100% { transform: translateY(0); }
              }
              .animate-scan {
                animation: scan 2s ease-in-out infinite;
              }
            `}</style>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
