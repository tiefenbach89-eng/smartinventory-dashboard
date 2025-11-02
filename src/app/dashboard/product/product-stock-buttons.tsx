'use client';

import { useState, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { IconPlus, IconMinus } from '@tabler/icons-react';
import { useRolePermissions } from '@/hooks/useRolePermissions';

const supabase = createClient();

type Product = {
  artikelnummer: number;
  artikelbezeichnung: string;
  bestand: number;
  preis: number;
  image_url?: string;
  lieferant?: string;
};

export default function ProductStockButtons() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [price, setPrice] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🔒 Berechtigungen laden
  const { permissions, loading: loadingPerms } = useRolePermissions();
  const canAdd = permissions?.can_add_stock;
  const canRemove = permissions?.can_remove_stock;
  const canList = permissions?.can_list_products;

  // 👤 Aktuellen User holen
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  // 📦 Produkte laden
  useEffect(() => {
    supabase
      .from('artikel')
      .select('*')
      .order('artikelbezeichnung', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data);
      });
  }, []);

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
        `Stock successfully ${type === 'add' ? 'added' : 'removed'} for "${product.artikelbezeichnung}".`
      );

      setSelectedProduct('');
      setQuantity('');
      setPrice('');
      setNote('');
      setDeliveryNote('');
      setOpenAdd(false);
      setOpenRemove(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔹 Blur-Styling & Button Group
  return (
    <div className='flex gap-3'>
      {/* ➕ Add Stock */}
      <Button
        onClick={() => setOpenAdd(true)}
        variant='outline'
        disabled={!canAdd}
        className={cn(
          'border-border text-foreground transition-all duration-500',
          canAdd
            ? 'hover:border-green-400 hover:bg-green-500/10 hover:text-green-400'
            : 'pointer-events-none opacity-40 blur-[1px]'
        )}
      >
        <IconPlus className='mr-2 h-4 w-4' /> Add Stock
      </Button>

      {/* ➖ Remove Stock */}
      <Button
        onClick={() => setOpenRemove(true)}
        variant='outline'
        disabled={!canRemove}
        className={cn(
          'border-border text-foreground transition-all duration-500',
          canRemove
            ? 'hover:border-red-400 hover:bg-red-500/10 hover:text-red-400'
            : 'pointer-events-none opacity-40 blur-[1px]'
        )}
      >
        <IconMinus className='mr-2 h-4 w-4' /> Remove Stock
      </Button>

      {/* 🧾 List Product */}
      <Link
        href='/dashboard/product/new'
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'border-border text-foreground transition-all duration-500',
          canList
            ? 'hover:border-amber-400 hover:bg-amber-400/10 hover:text-amber-400'
            : 'pointer-events-none opacity-40 blur-[1px]'
        )}
      >
        <IconPlus className='mr-2 h-4 w-4' /> List Product
      </Link>

      {/* ➕ Add Stock Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent className='max-w-md sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Select product and add quantity to stock.
            </DialogDescription>
          </DialogHeader>

          {/* Produkt Auswahl */}
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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

          {/* Produktbild */}
          {selected?.image_url && (
            <div className='flex justify-center'>
              <img
                src={selected.image_url}
                alt={selected.artikelbezeichnung}
                className='border-border/40 mt-2 mb-4 h-32 w-32 rounded-md border object-cover shadow-sm'
              />
            </div>
          )}

          {/* Formularfelder */}
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <label className='text-sm font-medium'>Quantity</label>
              <Input
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />
            </div>
            <div>
              <label className='text-sm font-medium'>
                New Price (€) (optional)
              </label>
              <Input
                type='number'
                step='0.01'
                value={price}
                onChange={(e) => setPrice(+e.target.value)}
              />
            </div>
            <div>
              <label className='text-sm font-medium'>
                Delivery Note Number
              </label>
              <Input
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Note (optional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={() => handleStockChange('add')}
              disabled={loading}
              className='bg-primary text-primary-foreground hover:bg-primary/90 mt-2 transition-all'
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ➖ Remove Stock Dialog */}
      <Dialog open={openRemove} onOpenChange={setOpenRemove}>
        <DialogContent className='max-w-md sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>Remove Stock</DialogTitle>
            <DialogDescription>
              Select product and quantity to remove from stock.
            </DialogDescription>
          </DialogHeader>

          {/* Produkt Auswahl */}
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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

          {/* Produktbild */}
          {selected?.image_url && (
            <div className='flex justify-center'>
              <img
                src={selected.image_url}
                alt={selected.artikelbezeichnung}
                className='border-border/40 mt-2 mb-4 h-32 w-32 rounded-md border object-cover shadow-sm'
              />
            </div>
          )}

          {/* Formular */}
          <div className='grid grid-cols-1 gap-4'>
            <div>
              <label className='text-sm font-medium'>Quantity</label>
              <Input
                type='number'
                value={quantity}
                onChange={(e) => setQuantity(+e.target.value)}
              />
            </div>
            <div>
              <label className='text-sm font-medium'>Note (optional)</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <div className='flex justify-end'>
            <Button
              onClick={() => handleStockChange('remove')}
              disabled={loading}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90 mt-2 transition-all'
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
