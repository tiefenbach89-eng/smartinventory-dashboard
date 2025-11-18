import { notFound } from 'next/navigation';
import {
  fakeProducts,
  type Product as MockProduct
} from '@/constants/mock-api';
import ClientWrapper from './client-wrapper'; // Client Component

export default async function Page({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  // ⬅️ params awaiten
  const { productId } = await params;

  // Nur der Key-Name, OHNE Namespace
  let pageTitleKey: string = 'createTitle';

  // Standarddaten (Neues Produkt)
  let safeProduct = {
    artikelnummer: 0,
    name: '',
    supplier: '',
    price: 0,
    minStock: 0,
    description: '',
    image: [] as File[]
  };

  // Wenn bestehendes Produkt
  if (productId !== 'new') {
    const parsedId = Number(productId);
    if (Number.isNaN(parsedId)) notFound();

    const data = await fakeProducts.getProductById(parsedId);
    if (!data || !data.success || !data.product) notFound();

    const product = data.product as MockProduct;

    // Key für Bearbeitungs-Titel
    pageTitleKey = 'editTitle';

    safeProduct = {
      artikelnummer: parsedId,
      name: product.name ?? '',
      supplier: product.category ?? '',
      price: Number(product.price) || 0,
      minStock: 0,
      description: product.description ?? '',
      image: []
    };
  }

  return <ClientWrapper product={safeProduct} pageTitleKey={pageTitleKey} />;
}
