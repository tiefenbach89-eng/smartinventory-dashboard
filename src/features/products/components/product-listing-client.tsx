'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Pencil, History, Eye, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export default function ProductListing() {
  const supabase = createClient()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'low' | 'instock'>('all')
  const [editProduct, setEditProduct] = useState<any | null>(null)
  const [viewLogs, setViewLogs] = useState<any | null>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // 🟡 Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      const { data, error } = await supabase.from('artikel').select('*')
      if (error) toast.error('Error loading products: ' + error.message)
      else setProducts(data || [])
      setLoading(false)
    }
    fetchProducts()
  }, [supabase])

  // 🧠 Filter + Search combined
  const filtered = products
    .filter((p) =>
      [p.artikelnummer, p.artikelbezeichnung, p.lieferant, p.beschreibung]
        .join(' ')
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .filter((p) => {
      if (filter === 'low') return p.bestand <= (p.sollbestand || 0)
      if (filter === 'instock') return p.bestand > (p.sollbestand || 0)
      return true
    })

  // ✏️ Save edited product
  async function handleSave() {
    if (!editProduct) return
    const { artikelnummer, bestand, sollbestand, beschreibung } = editProduct
    const { error } = await supabase
      .from('artikel')
      .update({ bestand, sollbestand, beschreibung })
      .eq('artikelnummer', artikelnummer)

    if (error) toast.error('Update failed: ' + error.message)
    else {
      toast.success('✅ Product updated successfully.')
      setEditProduct(null)
      const { data } = await supabase.from('artikel').select('*')
      setProducts(data || [])
    }
  }

  // 🗑️ Delete product
  async function handleDelete(articleNumber: string) {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const { error } = await supabase
        .from('artikel')
        .delete()
        .eq('artikelnummer', articleNumber)
      if (error) throw error

      toast.success('🗑️ Product deleted successfully.')
      setProducts(products.filter((p) => p.artikelnummer !== articleNumber))
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  // 📦 Fetch logs
  async function fetchLogs(articleNumber: string) {
    try {
      setLogsLoading(true)
      setViewLogs(articleNumber)
      const { data, error } = await supabase
        .from('artikel_log')
        .select('timestamp, aktion, menge_diff, kommentar, benutzer')
        .eq('artikelnummer', articleNumber)
        .order('timestamp', { ascending: false })
      if (error) throw error
      setLogs(data || [])
    } catch (err: any) {
      toast.error('Failed to load logs: ' + err.message)
    } finally {
      setLogsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage products and track movements</CardDescription>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-1" /> View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilter('all')}>
                Show All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('instock')}>
                In Stock
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter('low')}>
                Low Stock
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Article Number</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Price (€)</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Stock / Min</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.artikelnummer}>
                    <TableCell>
                      {p.image_url ? (
                        <img
                          src={
                            p.image_url && p.image_url.trim() !== ''
                              ? p.image_url
                              : 'https://placehold.co/100x100?text=No+Image'
                          }
                          alt={p.artikelbezeichnung || 'Product Image'}
                          className="h-10 w-10 rounded-md object-cover cursor-pointer hover:scale-105 transition-transform"
                          onDoubleClick={() =>
                            setImagePreview(
                              p.image_url && p.image_url.trim() !== ''
                                ? p.image_url
                                : 'https://placehold.co/600x600?text=No+Image'
                            )
                          }
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{p.artikelnummer}</TableCell>
                    <TableCell>{p.artikelbezeichnung}</TableCell>
                    <TableCell>{p.lieferant}</TableCell>
                    <TableCell>{p.preis?.toFixed(2)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {p.beschreibung || '—'}
                    </TableCell>
                    <TableCell>
                      Stock: {p.bestand} / Min: {p.sollbestand || 0}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditProduct(p)}
                      >
                        <Pencil className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchLogs(p.artikelnummer)}
                      >
                        <History className="h-4 w-4 mr-1" /> Movements
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(p.artikelnummer)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* 🖊️ Edit Modal */}
      <Dialog open={!!editProduct} onOpenChange={() => setEditProduct(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Adjust minimum stock or description. Core product data is locked.
            </DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="space-y-4">
              <Input value={editProduct.artikelnummer} disabled />
              <Input value={editProduct.artikelbezeichnung} disabled />
              <Input value={editProduct.lieferant} disabled />
              <Input value={editProduct.preis} disabled />
              <Input
                type="number"
                value={editProduct.bestand || 0}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, bestand: +e.target.value })
                }
              />
              <Input
                type="number"
                value={editProduct.sollbestand || 0}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    sollbestand: +e.target.value,
                  })
                }
              />
              <Input
                value={editProduct.beschreibung || ''}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    beschreibung: e.target.value,
                  })
                }
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditProduct(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🧾 Logs Modal */}
      <Dialog open={!!viewLogs} onOpenChange={() => setViewLogs(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle>
            Movement History for:{" "}
            <span className="font-semibold">
              {products.find((p) => p.artikelnummer === viewLogs)?.artikelbezeichnung ||
                'Unknown'}
            </span>
            <span className="block text-sm text-muted-foreground">
              Article #{viewLogs}
            </span>
          </DialogTitle>
          {logsLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movements found.</p>
          ) : (
            <div className="mt-3 border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Comment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        {new Date(log.timestamp).toLocaleDateString('en-GB')}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            log.menge_diff >= 0
                              ? 'bg-green-500/20 text-green-400 border-green-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }
                        >
                          {log.menge_diff >= 0 ? 'Added' : 'Removed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {Math.abs(log.menge_diff)}
                      </TableCell>
                      <TableCell>{log.benutzer || 'System'}</TableCell>
                      <TableCell>{log.kommentar || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 🖼️ Image Preview Modal */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-3xl p-0 border-none shadow-lg">
          <VisuallyHidden>
            <DialogTitle>Product Image Preview</DialogTitle>
          </VisuallyHidden>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Product Preview"
              className="w-full h-auto rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}
