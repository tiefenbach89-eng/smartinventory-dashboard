'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const supabase = createClient()

type Product = {
  artikelnummer: number
  artikelbezeichnung: string
  bestand: number
  preis: number
  lieferant?: string
}

export default function ProductStockButtons() {
  const [openAdd, setOpenAdd] = useState(false)
  const [openRemove, setOpenRemove] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(0)
  const [price, setPrice] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 🔹 Aktuellen Benutzer aus Supabase laden
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user) setUser(data.user)
    }
    getUser()
  }, [])

  // 🔹 Produkte für Dropdown laden
  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from('artikel')
        .select('artikelnummer, artikelbezeichnung, bestand, preis, lieferant')
        .order('artikelbezeichnung', { ascending: true })

      if (!error && data) setProducts(data)
    }
    fetchProducts()
  }, [])

  const handleStockChange = async (type: 'add' | 'remove') => {
    console.log('🟡 handleStockChange started', type, { selectedProduct, quantity, price, note })
    console.log('Inserted into table artikel_log in schema "public"')
    try {
      setLoading(true)
      toast.loading(type === 'add' ? 'Adding stock...' : 'Removing stock...')

      const quantityDiff = type === 'add' ? quantity : -quantity
      const selected = products.find(
        (p) => String(p.artikelnummer) === selectedProduct
      )

      if (!selected) {
        toast.error('Please select a valid product.')
        setLoading(false)
        toast.dismiss()
        return
      }

      const { data: product, error: fetchErr } = await supabase
        .from('artikel')
        .select('*')
        .eq('artikelnummer', Number(selectedProduct))
        .single()

      if (fetchErr || !product) {
        toast.error('Product not found in database.')
        setLoading(false)
        toast.dismiss()
        return
      }

      const oldStock = product.bestand
      const newStock = oldStock + quantityDiff

      // ❌ Kein negativer Bestand erlaubt
      if (newStock < 0) {
        toast.error(
          `Cannot remove ${Math.abs(quantityDiff)} items. Only ${oldStock} in stock.`
        )
        setLoading(false)
        toast.dismiss()
        return
      }

      // 2️⃣ Bestand und Preis aktualisieren (falls Preis angegeben)
      const updateData: any = { bestand: newStock }
      if (price !== null) updateData.preis = price

      const { error: updateErr } = await supabase
        .from('artikel')
        .update(updateData)
        .eq('artikelnummer', Number(selectedProduct))

      if (updateErr) throw updateErr

      // 3️⃣ Eintrag in artikel_log schreiben
      const { error: logErr } = await supabase.from('artikel_log').insert([
        {
          timestamp: new Date().toISOString(),
          artikelnummer: selectedProduct,
          artikelname: product.artikelbezeichnung,
          alt_wert: oldStock,
          neu_wert: newStock,
          menge_diff: quantityDiff,
          preis_snapshot: price ?? product.preis,
          aktion: type === 'add' ? 'zubuchung' : 'ausbuchung',
          kommentar: note,
          lieferant: product.lieferant,
          benutzer: user?.email ?? 'System',
        },
      ])

      console.log('✅ Insert into artikel_log executed')
if (logErr) {
  console.error('❌ Log insert error:', logErr)
  toast.error('Log insert failed: ' + logErr.message)
} else {
  console.log('✅ Log insert successful')
}

      // 🧩 Fehler beim Loggen anzeigen (falls auftritt)
      if (logErr) {
        console.error('❌ Log insert error:', logErr)
        toast.error('Log insert failed: ' + logErr.message)
      }

      // ✅ Erfolgsmeldung
      toast.success(
        `✅ Stock successfully ${
          type === 'add' ? 'added' : 'removed'
        } for "${product.artikelbezeichnung}".`
      )

      // Eingabefelder zurücksetzen
      setOpenAdd(false)
      setOpenRemove(false)
      setSelectedProduct('')
      setQuantity(0)
      setNote('')
      setPrice(null)
    } catch (err: any) {
      console.error('❌ Supabase error:', err)
      toast.error('Something went wrong: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
      toast.dismiss()
    }
  }

  const renderProductSelect = () => (
    <Select
      onValueChange={(val) => setSelectedProduct(val)}
      value={selectedProduct}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select Product" />
      </SelectTrigger>
      <SelectContent className="max-h-60 overflow-y-auto">
        {products.length === 0 ? (
          <SelectItem value="none" disabled>
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
  )

  return (
    <>
      {/* 🟡 Buttons */}
      <Button
        onClick={() => setOpenAdd(true)}
        className="bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        + Add Stock
      </Button>

      <Button
        onClick={() => setOpenRemove(true)}
        className="bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        - Remove Stock
      </Button>

      {/* 🟢 Add Stock Dialog */}
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {renderProductSelect()}
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Input
              type="number"
              placeholder="New Price (€) (optional)"
              value={price ?? ''}
              onChange={(e) => setPrice(Number(e.target.value))}
            />
            <Textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleStockChange('add')}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
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
          <div className="space-y-3">
            {renderProductSelect()}
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <Textarea
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              onClick={() => handleStockChange('remove')}
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
