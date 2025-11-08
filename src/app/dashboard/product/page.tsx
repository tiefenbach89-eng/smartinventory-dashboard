'use client';
import { SquarePlus, SquareMinus, Boxes } from 'lucide-react';
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

export default function ProductsPage() {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('' as any);
  const [price, setPrice] = useState<number | ''>('' as any);
  const [note, setNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
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

  async function handleStockChange(type: 'add' | 'remove') {
    try {
      setLoading(true);
      if (!selectedProduct) throw new Error('Please select a product.');
      if (!quantity || quantity <= 0)
        throw new Error('Please enter a valid quantity.');

      const product = selected;
      if (!product) throw new Error('Product not found.');

      const newStock =
        type === 'add'
          ? product.bestand + +quantity
          : product.bestand - +quantity;
      if (newStock < 0) throw new Error('Insufficient stock.');

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
        })
      });

      const json = await res.json();
      if (!res.ok || json.error)
        throw new Error(json.error || 'Failed to save log entry');

      toast.success(
        `Stock successfully ${
          type === 'add' ? 'added' : 'removed'
        } for "${product.artikelbezeichnung}".`
      );

      setSelectedProduct('');
      setQuantity('');
      setPrice('');
      setNote('');
      setDeliveryNote('');
      type === 'add' ? setOpenAdd(false) : setOpenRemove(false);
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
            Products
          </h2>
        </div>

        {/* Tabs */}
        <Tabs defaultValue='add' className='w-full'>
          <TabsList className='bg-card/25 border-border/10 flex h-auto w-full flex-wrap items-center justify-center gap-2 rounded-3xl border px-2 py-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md sm:h-11 sm:w-fit sm:flex-nowrap sm:py-0'>
            <TabsTrigger
              value='add'
              onClick={() => setOpenAdd(true)}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(52,211,153,0.35)]'
            >
              <SquarePlus className='h-4 w-4 transition-colors duration-200 group-hover:text-emerald-400' />
              Add Stock
            </TabsTrigger>

            <TabsTrigger
              value='remove'
              onClick={() => setOpenRemove(true)}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(239,68,68,0.35)]'
            >
              <SquareMinus className='h-4 w-4 transition-colors duration-200 group-hover:text-red-400' />
              Remove Stock
            </TabsTrigger>

            <TabsTrigger
              value='list'
              onClick={handleListProduct}
              className='group hover:bg-background/60 hover:text-foreground data-[state=active]:bg-background/90 data-[state=active]:text-foreground relative flex h-9 items-center gap-2 rounded-2xl border-none px-4 text-sm font-medium shadow-none ring-0 transition-all duration-200 outline-none focus-visible:ring-0 focus-visible:ring-offset-0 data-[state=active]:shadow-[0_0_15px_-3px_rgba(96,165,250,0.35)]'
            >
              <Boxes className='h-4 w-4 transition-colors duration-200 group-hover:text-sky-400' />
              List Product
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        <CardModern className='space-y-8 p-4 sm:p-6 md:p-8'>
          <ProductListing />
        </CardModern>

        {/* ADD STOCK DIALOG */}
        <Dialog open={openAdd} onOpenChange={setOpenAdd}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:w-full sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle className='text-lg font-semibold sm:text-xl'>
                Add Stock
              </DialogTitle>
              <DialogDescription>
                Select product and add quantity to stock.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {mounted && (
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select Product' />
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

              {selected?.image_url && (
                <div className='flex justify-center'>
                  <img
                    src={selected.image_url}
                    alt={selected.artikelbezeichnung}
                    className='border-border/40 mt-2 mb-4 h-32 w-32 rounded-md border object-cover shadow-sm'
                  />
                </div>
              )}

              <div className='grid gap-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    Quantity
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    New Price (€)
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
                    Delivery Note Number
                  </label>
                  <Input
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    Note (optional)
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
                  onClick={() => handleStockChange('add')}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* REMOVE STOCK DIALOG */}
        <Dialog open={openRemove} onOpenChange={setOpenRemove}>
          <DialogContent className='bg-card/95 border-border/40 w-[95vw] rounded-2xl border backdrop-blur-md sm:w-full sm:max-w-lg'>
            <DialogHeader>
              <DialogTitle className='text-lg font-semibold sm:text-xl'>
                Remove Stock
              </DialogTitle>
              <DialogDescription>
                Select product and quantity to remove.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              {mounted && (
                <Select
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select Product' />
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

              <div className='grid gap-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    Quantity
                  </label>
                  <Input
                    type='number'
                    value={quantity}
                    onChange={(e) => setQuantity(+e.target.value)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>
                    Note (optional)
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
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageContainer>
  );
}
