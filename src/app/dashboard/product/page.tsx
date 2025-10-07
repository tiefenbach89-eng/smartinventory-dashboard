import PageContainer from '@/components/layout/page-container';
import { buttonVariants, Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import ProductListingClient from '@/features/products/components/product-listing-client';

// 🧩 Neu importieren:
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
      <div className="flex flex-1 flex-col space-y-4">
        <div className="flex items-start justify-between">
          <Heading
            title="Products"
            description="Manage products (Server side table functionalities.)"
          />
          <div className="flex gap-2">
            {/* 🔘 Neue Buttons */}
            <ProductStockButtons />

            {/* Bestehender Add-New Button */}
            <Link
              href="/dashboard/product/new"
              className={cn(buttonVariants(), 'text-xs md:text-sm bg-yellow-400 hover:bg-yellow-500 text-black')}
            >
              <IconPlus className="mr-2 h-4 w-4" /> Add New
            </Link>
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
