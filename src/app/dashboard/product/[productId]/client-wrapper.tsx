'use client';

import ProductForm from '@/features/products/components/product-form';

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
  pageTitle: string;
};

export default function ClientWrapper({ product, pageTitle }: Props) {
  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}
