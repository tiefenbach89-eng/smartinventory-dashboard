'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
import { buttonVariants } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';

const supabase = createClient();

type Product = {
  artikelnummer: number;
  artikelbezeichnung: string;
  bestand: number;
  preis: number;
  lieferant?: string;
};

export default function ProductStockButtons() {
  const [openAdd, setOpenAdd] = useState(false);
  const [openRemove, setOpenRemove] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // 🧠 Load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user ?? null));
  }, []);

  // 📦 Load product list
  useEffect(() => {
    supabase
      .from('artikel')
      .select('artikelnummer, artikelbezeichnung, bestand, preis, lieferant')
      .order('artikelbezeichnung', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setProducts(data);
      });
  }, []);

  // 🔧 Handle Add / Remove Stock
  const handleStockChange = async (type: 'add' | 'remove') => {
    try {
      setLoading(true);
      toast.loading(type === 'add' ? 'Adding stock...' : 'Removing stock...');

      const selected = products.find(
        (p) => String(p.artikelnummer) === selectedProduct
      );
      if (!selected) throw new Error('Please select a valid product.');

      const quantityDiff = type === 'add' ? quantity : -quantity;
      const oldStock = selected.bestand;
      const newStock = oldStock + quantityDiff;

      if (newStock < 0)
        throw new Error(
          `Cannot remove ${Math.abs(
            quantityDiff
          )} items. Only ${oldStock} in stock.`
        );

      // 🧾 Benutzername oder Fallback bestimmen
      const benutzer =
        user?.user_metadata?.first_name || user?.user_metadata?.last_name
          ? `${user?.user_metadata?.first_name ?? ''} ${
              user?.user_metadata?.last_name ?? ''
            }`.trim()
          : (user?.email ?? 'System');

      // 🔄 Call secure API
      const res = await fetch('/api/stock-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artikelnummer: selected.artikelnummer,
          artikelname: selected.artikelbezeichnung,
          alt_wert: oldStock,
          neu_wert: newStock,
          menge_diff: quantityDiff,
          preis_snapshot: price ?? selected.preis,
          aktion: type === 'add' ? 'addition' : 'removal',
          kommentar: note,
          lieferant: selected.lieferant,
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
        } for "${selected.artikelbezeichnung}".`
      );

      // Reset all fields
      setSelectedProduct('');
      setQuantity(0);
      setPrice(null);
      setNote('');
      setDeliveryNote('');
      setOpenAdd(false);
      setOpenRemove(false);
    } catch (err: any) {
      console.error('❌', err);
      toast.error(err.message);
    } finally {
      toast.dismiss();
      setLoading(false);
    }
  };

  // 🔽 Product Selector
  const renderProductSelect = () => (
    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
      <SelectTrigger>
        <SelectValue placeholder='Select Product' />
      </SelectTrigger>
      <SelectContent className='max-h-60 overflow-y-auto'>
        {products.length === 0 ? (
          <SelectItem value='none' disabled>
            Loading products...
          </SelectItem>
        ) : (
          products.map((p) => (
            <SelectItem key={p.artikelnummer} value={String(p.artikelnummer)}>
              {p.artikelbezeichnung} ({p.artikelnummer})
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );

  return (
    <div className='flex gap-2'>
      {/* ➕ Add Stock */}
      <Button
        onClick={() => setOpenAdd(true)}
        variant='outline'
        className='border-border hover:bg-muted text-foreground border bg-transparent'
      >
        + Add Stock
      </Button>

      {/* ➖ Remove Stock */}
      <Button
        onClick={() => setOpenRemove(true)}
        variant='outline'
        className='border-border hover:bg-muted border bg-transparent text-red-600 hover:text-red-700'
      >
        - Remove Stock
      </Button>

      {/* ➕ Add Product */}
      <Link
        href='/dashboard/product/new'
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'border-border hover:bg-muted text-foreground border bg-transparent text-xs md:text-sm'
        )}
      >
        <IconPlus className='mr-2 h-4 w-4' /> Add Product
      </Link>

      {/* 🟢 Add Stock Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            {renderProductSelect()}
            <Input
              type='number'
              placeholder='Quantity'
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Input
              type='number'
              placeholder='New Price (€) (optional)'
              value={price ?? ''}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <Input
              placeholder='Delivery Note Number'
              value={deliveryNote}
              onChange={(e) => setDeliveryNote(e.target.value)}
            />
            <Textarea
              placeholder='Note (optional)'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button onClick={() => handleStockChange('add')} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🔴 Remove Stock Dialog */}
      <Dialog open={openRemove} onOpenChange={setOpenRemove}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Stock</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            {renderProductSelect()}
            <Input
              type='number'
              placeholder='Quantity'
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Textarea
              placeholder='Note (optional)'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleStockChange('remove')}
              disabled={loading}
              className='bg-red-100 text-red-700 hover:bg-red-200'
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
