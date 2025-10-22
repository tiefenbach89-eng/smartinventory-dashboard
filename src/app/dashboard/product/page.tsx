import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ProductListingClient from '@/features/products/components/product-listing-client';

// 🧩 Buttons für Add / Remove Stock
import ProductStockButtons from './product-stock-buttons';

export const metadata = {
  title: 'Dashboard: Products'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Products'
            description='Manage products (Server-side table functionalities.)'
          />

          <div className='flex gap-2'>
            {/* 🧱 Add / Remove Stock Buttons */}
            <ProductStockButtons />
          </div>
        </div>

        <Separator />

        <Suspense
          fallback={
            <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
          }
        >
          <ProductListingClient />
        </Suspense>
      </div>
    </PageContainer>
  );
}
