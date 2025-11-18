'use client';

import ProductForm from '@/features/products/components/product-form';
import { useTranslations } from 'next-intl';

type Props = {
  product: {
    artikelnummer: number;
    name: string;
    supplier: string;
    price: number;
    minStock: number;
    description: string;
    image: File[];
  };
  pageTitleKey: string; // <-- NICHT pageTitle
};

export default function ClientWrapper({ product, pageTitleKey }: Props) {
  const t = useTranslations('ProductsForm');

  // Übersetzung hier auflösen
  const pageTitle = t(pageTitleKey);

  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}
