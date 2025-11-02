import {
  fakeProducts,
  type Product as MockProduct
} from '../../../constants/mock-api';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product: MockProduct | null = null;
  let pageTitle = 'List New Product';

  // 🧭 Wenn wir ein bestehendes Produkt laden
  if (productId !== 'new') {
    const data = await fakeProducts.getProductById(Number(productId));

    if (!data || !data.success || !data.product) {
      notFound();
    }

    product = data.product as MockProduct;
    pageTitle = 'Edit Product';
  }

  // 🧩 Mock-Produkt -> Formularstruktur mappen
  const safeProduct = product
    ? {
        artikelnummer: Number(product.id) || 0, // id → artikelnummer
        name: product.name ?? '',
        supplier: product.category ?? '', // category → supplier
        price: Number(product.price) || 0,
        minStock: 0, // mock hat kein Stock
        description: product.description ?? '',
        image: [] as File[] // erwarteter Typ
      }
    : {
        artikelnummer: 0,
        name: '',
        supplier: '',
        price: 0,
        minStock: 0,
        description: '',
        image: [] as File[]
      };

  // ✅ Formular rendern
  return <ProductForm initialData={safeProduct} pageTitle={pageTitle} />;
}
