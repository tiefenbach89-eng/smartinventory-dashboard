import { notFound } from 'next/navigation';
import {
  fakeProducts,
  type Product as MockProduct
} from '@/constants/mock-api';
import ClientWrapper from './client-wrapper'; // Client Component (mit 'use client' in der Datei selbst)

export default async function Page({
  params
}: {
  params: Promise<{ productId: string }>;
}) {
  // ⬅️ WICHTIG: params ist ein Promise — hier awaiten
  const { productId } = await params;

  let pageTitle = 'List New Product';

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

  // Bestehendes Produkt laden
  if (productId !== 'new') {
    const parsedId = Number(productId);
    if (Number.isNaN(parsedId)) notFound();

    const data = await fakeProducts.getProductById(parsedId);
    if (!data || !data.success || !data.product) notFound();

    const product = data.product as MockProduct;

    pageTitle = 'Edit Product';
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

  // ClientWrapper rendert die Client-Form
  return <ClientWrapper product={safeProduct} pageTitle={pageTitle} />;
}
