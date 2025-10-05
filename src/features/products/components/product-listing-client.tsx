"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProductTable } from "./product-tables";
import { columns } from "./product-tables/columns";

export default function ProductListingClient() {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from("artikel").select("*").order("artikelnummer", { ascending: true });
      if (error) {
        console.error("❌ Supabase error:", error.message);
      } else {
        const mapped = (data || []).map((a) => ({
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
  }, []);

  if (loading)
    return <div className="p-4 text-muted-foreground">Loading articles...</div>;

  return <ProductTable data={products} totalItems={products.length} columns={columns} />;
}
