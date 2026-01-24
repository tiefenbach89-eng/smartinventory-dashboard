'use client';

import ProductForm from './product-form';
import { useTranslations } from 'next-intl';

type TProductViewPageProps = {
  product: {
    artikelnummer: number;
    name: string;
    supplier: string;
    price: number;
    minStock: number;
    description: string;
    image: File[];
  };
  pageTitleKey: string; // <-- Wichtig: KEY, kein fertiger Text!
};

export default function ProductViewPage({
  product,
  pageTitleKey
}: TProductViewPageProps) {
  const t = useTranslations('ProductsForm');

  // ✔ Key in Text umwandeln
  const pageTitle = t(pageTitleKey);

  // ✔ Fertigen Text an ProductForm weitergeben
  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}
