"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductTable } from "./product-tables";
import { columns } from "./product-tables/columns";

export interface Article {
  artikelnummer: number;
  artikelbezeichnung: string;
  bestand: number;
  sollbestand: number | null;
  preis: number;
  lieferant: string;
  image_url?: string | null;
}

interface ProductRow {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  photo_url: string;
}

export default function ProductListingClient() {
  const supabase = createClient();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("artikel")
        .select("*")
        .order("artikelnummer", { ascending: true });

      if (error) {
        console.error("❌ Supabase fetch error:", error.message);
      } else {
        console.log("✅ Supabase data:", data);
        const mapped: ProductRow[] = (data || []).map((a) => ({
          id: a.artikelnummer ?? 0,
          name: a.artikelbezeichnung || "—",
          category: a.lieferant || "—",
          price: a.preis ?? 0,
          description: `Stock: ${a.bestand ?? 0} / Min: ${a.sollbestand ?? 0}`,
          photo_url:
            a.image_url && a.image_url.trim() !== ""
              ? a.image_url
              : "https://placehold.co/100x100?text=No+Image",
        }));
        setProducts(mapped);
      }

      setLoading(false);
    }

    load();
  }, [supabase]);

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading products...</div>;
  }

  return (
    <ProductTable
      data={products}
      totalItems={products.length}
      columns={columns}
    />
  );
}
