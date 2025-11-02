import { fakeProducts, Product } from '@/constants/mock-api';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { Loader2 } from 'lucide-react';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  // 🧱 Basisdaten
  let product: Product | null = null;
  let pageTitle = 'List New Product';

  // 🧭 Wenn wir kein neues Produkt anlegen, sondern ein vorhandenes laden
  if (productId !== 'new') {
    const data = await fakeProducts.getProductById(Number(productId));
    product = data.product as Product;

    if (!product) {
      notFound();
    }

    pageTitle = `Edit Product`;
  }

  // 🧩 Wenn kein Produkt vorhanden ist, initialisiere leeres Objekt
  // So bleibt React-Formular controlled
  const safeProduct = product ?? {
    artikelnummer: '',
    name: '',
    supplier: '',
    price: 0,
    minStock: 0,
    description: '',
    image: []
  };

  // ✅ Formular immer mit definierten Werten rendern
  return <ProductForm initialData={safeProduct} pageTitle={pageTitle} />;
}
