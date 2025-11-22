import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClientWrapper from './client-wrapper';

export default async function Page(props: {
  params: Promise<{ productId: string }>;
}) {
  // ⬅️ WICHTIG: In Next.js 14/15 ist params ein Promise
  const { productId } = await props.params;

  // 🎯 Standard: Neues Produkt
  let pageTitleKey: 'createTitle' | 'editTitle' = 'createTitle';

  let safeProduct = {
    artikelnummer: 0,
    name: '',
    supplier: '',
    price: 0,
    minStock: 0,
    description: '',
    ean: '',
    image: [] as File[]
  };

  // 🔐 Server-Supabase
  const supabase = await createClient();

  // 🆕 Modus: Neues Produkt
  if (productId === 'new') {
    return <ClientWrapper product={safeProduct} pageTitleKey={pageTitleKey} />;
  }

  // 🔍 productId = Zahl prüfen
  const numericId = Number(productId);
  if (Number.isNaN(numericId)) {
    notFound();
  }

  // 📦 Produkt aus DB laden
  const { data: produkt, error } = await supabase
    .from('artikel')
    .select('*')
    .eq('artikelnummer', numericId)
    .maybeSingle();

  if (!produkt || error) {
    notFound();
  }

  // ✏️ Bearbeiten
  pageTitleKey = 'editTitle';

  safeProduct = {
    artikelnummer: produkt.artikelnummer,
    name: produkt.artikelbezeichnung ?? '',
    supplier: produkt.lieferant ?? '',
    price: produkt.preis ?? 0,
    minStock: produkt.sollbestand ?? 0,
    description: produkt.beschreibung ?? '',
    ean: produkt.ean ?? '',
    image: [] // Upload wird Client-seitig gemacht
  };

  return <ClientWrapper product={safeProduct} pageTitleKey={pageTitleKey} />;
}
