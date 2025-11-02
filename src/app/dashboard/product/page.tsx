'use client';

import { Suspense, useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import ProductListingClient from '@/features/products/components/product-listing-client';
import ProductStockButtons from './product-stock-buttons';
import { useRolePermissions } from '@/hooks/useRolePermissions';
import { Loader2, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

// 🧠 Neues Feature: Weiche visuelle Sperre für nicht berechtigte Rollen
export default function ProductsPage() {
  const { permissions, loading: loadingPerms } = useRolePermissions();

  const [isReadonly, setReadonly] = useState(false);

  // 🔸 Berechtigungen aus Hook
  const canList = permissions?.can_list_products;
  const canEdit = permissions?.can_edit_products;
  const canDelete = permissions?.can_delete_products;
  const canAddStock = permissions?.can_add_stock;
  const canRemoveStock = permissions?.can_remove_stock;

  // 🔹 Festlegen, ob Benutzer read-only (Viewer) ist
  useEffect(() => {
    if (!loadingPerms) {
      setReadonly(!canEdit && !canAddStock && !canRemoveStock && !canDelete);
    }
  }, [permissions, loadingPerms]);

  // 🕐 Ladeanzeige
  if (loadingPerms) {
    return (
      <PageContainer>
        <div className='text-muted-foreground flex h-[60vh] items-center justify-center'>
          <Loader2 className='mr-2 h-6 w-6 animate-spin' /> Checking
          permissions...
        </div>
      </PageContainer>
    );
  }

  // 🚫 Kein Zugriff auf Produkte (kein canList)
  if (!canList) {
    return (
      <PageContainer>
        <div className='text-muted-foreground flex h-[70vh] flex-col items-center justify-center space-y-4 text-center'>
          <EyeOff className='text-primary/70 h-10 w-10' />
          <h2 className='text-foreground text-2xl font-semibold'>
            Access Restricted
          </h2>
          <p>You don’t have permission to view the product list.</p>
        </div>
      </PageContainer>
    );
  }

  // ✅ Zugriff erlaubt
  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Products'
            description='Manage products (server-side table functionalities.)'
          />

          <div className='flex gap-2'>
            {/* Add / Remove Stock Buttons nur aktiv, wenn erlaubt */}
            <div
              className={
                !canAddStock && !canRemoveStock
                  ? 'pointer-events-none opacity-50 blur-[1px] transition-all duration-500'
                  : ''
              }
            >
              <ProductStockButtons />
            </div>
          </div>
        </div>

        <Separator />

        <div
          className={`relative transition-all duration-500 ${
            isReadonly ? 'pointer-events-none opacity-70 blur-[2px]' : ''
          }`}
        >
          <Suspense
            fallback={
              <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
            }
          >
            <ProductListingClient />
          </Suspense>

          {/* 🩶 Overlay-Text für Readonly-Zustand */}
          {isReadonly && (
            <div className='bg-background/50 text-muted-foreground absolute inset-0 flex items-center justify-center text-center backdrop-blur-sm'>
              <div>
                <p className='text-lg font-semibold'>Read-only view</p>
                <p className='text-sm opacity-80'>
                  You don’t have permission to modify products.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
