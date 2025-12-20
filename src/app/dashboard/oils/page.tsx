// src/app/dashboard/oils/page.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

type OilEntry = {
  id: string;
  name: string;
  supplier: string;
  deliveryDate: string;
  deliveryNote: string;
  pricePerLiter: number;
  volumeLiters: number;
  imageUrl?: string;
  mpmKey?: string;
  notes?: string;
};

const MPM_BASE_URL = 'https://www.mpmoil.com/en/productadvice';

const initialEntries: OilEntry[] = [
  {
    id: 'oil-1',
    name: 'MPM 5W-30 Premium Synthetic',
    supplier: 'MPM International',
    deliveryDate: '2025-02-10',
    deliveryNote: 'LS-1023',
    pricePerLiter: 6.9,
    volumeLiters: 60,
    imageUrl:
      'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=400&auto=format&fit=crop',
    mpmKey: '0603',
    notes: 'Fassware, temperiert lagern.'
  },
  {
    id: 'oil-2',
    name: 'MPM 0W-20 Premium Synthetic',
    supplier: 'MPM International',
    deliveryDate: '2025-01-28',
    deliveryNote: 'LS-0998',
    pricePerLiter: 7.4,
    volumeLiters: 208,
    imageUrl:
      'https://images.unsplash.com/photo-1487954152955-511c8121d7e8?w=400&auto=format&fit=crop',
    mpmKey: '0708',
    notes: 'Drum á 208 L, freigegeben für Hybrid-Flotte.'
  }
];

const numberFormatter = new Intl.NumberFormat('de-DE', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const euroFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR'
});

const buildMpmLink = (key?: string) => {
  if (!key) return MPM_BASE_URL;
  return `${MPM_BASE_URL}?kba=${encodeURIComponent(key.trim())}`;
};

const initialFormState = (today: string) => ({
  name: '',
  supplier: '',
  deliveryDate: today,
  deliveryNote: '',
  pricePerLiter: '',
  volumeLiters: '',
  imageUrl: '',
  mpmKey: '',
  notes: ''
});

export default function OilsPage() {
  const t = useTranslations('Oils');
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [entries, setEntries] = useState<OilEntry[]>(initialEntries);
  const [form, setForm] = useState<Record<string, string>>(
    initialFormState(today)
  );

  const totals = useMemo(() => {
    if (!entries.length) {
      return { liters: 0, avgPrice: 0, lastSupplier: '—' };
    }

    const liters = entries.reduce((sum, item) => sum + item.volumeLiters, 0);
    const avgPrice =
      entries.reduce((sum, item) => sum + item.pricePerLiter, 0) /
      entries.length;
    const lastSupplier =
      entries
        .slice()
        .sort((a, b) => b.deliveryDate.localeCompare(a.deliveryDate))[0]
        ?.supplier ?? '—';

    return { liters, avgPrice, lastSupplier };
  }, [entries]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !form.name ||
      !form.supplier ||
      !form.deliveryDate ||
      !form.pricePerLiter ||
      !form.volumeLiters
    ) {
      toast.error(t('toasts.missingFields'));
      return;
    }

    const price = Number(form.pricePerLiter);
    const volume = Number(form.volumeLiters);

    if (Number.isNaN(price) || Number.isNaN(volume)) {
      toast.error(t('toasts.invalidNumbers'));
      return;
    }

    const newEntry: OilEntry = {
      id: crypto.randomUUID ? crypto.randomUUID() : `oil-${Date.now()}`,
      name: form.name,
      supplier: form.supplier,
      deliveryDate: form.deliveryDate,
      deliveryNote: form.deliveryNote,
      pricePerLiter: price,
      volumeLiters: volume,
      imageUrl: form.imageUrl || undefined,
      mpmKey: form.mpmKey || undefined,
      notes: form.notes || undefined
    };

    setEntries((prev) => [newEntry, ...prev]);
    setForm(initialFormState(today));
    toast.success(t('toasts.added'));
  };

  const totalPrice = (entry: OilEntry) =>
    entry.pricePerLiter * entry.volumeLiters;

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className='text-2xl font-semibold tracking-tight'>
              {t('title')}
            </h2>
            <p className='text-muted-foreground mt-1 text-sm'>
              {t('description')}
            </p>
          </div>
          <Badge variant='outline' className='border-dashed'>
            {t('badge')}
          </Badge>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          <Card className='lg:col-span-2'>
            <CardHeader>
              <CardTitle>{t('formTitle')}</CardTitle>
              <CardDescription>{t('mpmHelp')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>{t('nameLabel')}</Label>
                    <Input
                      id='name'
                      value={form.name}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='supplier'>{t('supplierLabel')}</Label>
                    <Input
                      id='supplier'
                      value={form.supplier}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          supplier: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='deliveryDate'>{t('dateLabel')}</Label>
                    <Input
                      id='deliveryDate'
                      type='date'
                      value={form.deliveryDate}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          deliveryDate: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='deliveryNote'>
                      {t('deliveryNoteLabel')}
                    </Label>
                    <Input
                      id='deliveryNote'
                      value={form.deliveryNote}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          deliveryNote: e.target.value
                        }))
                      }
                      placeholder='LS-1234'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='pricePerLiter'>{t('priceLabel')}</Label>
                    <Input
                      id='pricePerLiter'
                      type='number'
                      step='0.01'
                      value={form.pricePerLiter}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          pricePerLiter: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='volumeLiters'>{t('volumeLabel')}</Label>
                    <Input
                      id='volumeLiters'
                      type='number'
                      step='0.1'
                      value={form.volumeLiters}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          volumeLiters: e.target.value
                        }))
                      }
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='imageUrl'>{t('imageLabel')}</Label>
                    <Input
                      id='imageUrl'
                      value={form.imageUrl}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          imageUrl: e.target.value
                        }))
                      }
                      placeholder='https://...'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='mpmKey'>{t('mpmKeyLabel')}</Label>
                    <Input
                      id='mpmKey'
                      value={form.mpmKey}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, mpmKey: e.target.value }))
                      }
                      placeholder='z. B. KBA/HSN-TSN'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='notes'>{t('notesLabel')}</Label>
                  <Textarea
                    id='notes'
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                  />
                </div>

                <Button type='submit' className='w-full sm:w-auto'>
                  {t('submit')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('statsTitle')}</CardTitle>
              <CardDescription>{t('mpmHelp')}</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <p className='text-muted-foreground text-sm'>
                    {t('statTotalLiters')}
                  </p>
                  <p className='text-lg font-semibold'>
                    {numberFormatter.format(totals.liters)} L
                  </p>
                </div>
                <Icons.oil className='text-primary h-6 w-6' />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <p className='text-muted-foreground text-sm'>
                    {t('statAvgPrice')}
                  </p>
                  <p className='text-lg font-semibold'>
                    {numberFormatter.format(totals.avgPrice)} €/L
                  </p>
                </div>
                <Icons.billing className='text-primary h-6 w-6' />
              </div>
              <div className='flex items-center justify-between rounded-lg border p-3'>
                <div>
                  <p className='text-muted-foreground text-sm'>
                    {t('statLastSupplier')}
                  </p>
                  <p className='text-lg font-semibold'>{totals.lastSupplier}</p>
                </div>
                <Icons.user className='text-primary h-6 w-6' />
              </div>
              <Link
                href={buildMpmLink()}
                target='_blank'
                rel='noreferrer'
                className='text-primary text-sm font-medium hover:underline'
              >
                {t('openMpm')}
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('tableTitle')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {entries.length === 0 ? (
              <p className='text-muted-foreground text-sm'>{t('empty')}</p>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('colOil')}</TableHead>
                      <TableHead>{t('colSupplier')}</TableHead>
                      <TableHead>{t('colDate')}</TableHead>
                      <TableHead>{t('colVolume')}</TableHead>
                      <TableHead>{t('colPrice')}</TableHead>
                      <TableHead>{t('colTotal')}</TableHead>
                      <TableHead>{t('colDeliveryNote')}</TableHead>
                      <TableHead className='text-right'>
                        {t('colActions')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className='min-w-[220px]'>
                          <div className='flex items-center gap-3'>
                            <div className='bg-muted relative h-12 w-12 overflow-hidden rounded-lg border'>
                              {entry.imageUrl ? (
                                <Image
                                  src={entry.imageUrl}
                                  alt={entry.name}
                                  fill
                                  className='object-cover'
                                  sizes='48px'
                                />
                              ) : (
                                <div className='text-muted-foreground flex h-full items-center justify-center text-[11px]'>
                                  {t('viewImage')}
                                </div>
                              )}
                            </div>
                            <div className='space-y-1'>
                              <p className='leading-tight font-semibold'>
                                {entry.name}
                              </p>
                              <p className='text-muted-foreground text-xs leading-tight'>
                                {entry.notes || ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{entry.supplier}</TableCell>
                        <TableCell>{entry.deliveryDate}</TableCell>
                        <TableCell>
                          {numberFormatter.format(entry.volumeLiters)}
                        </TableCell>
                        <TableCell>
                          {numberFormatter.format(entry.pricePerLiter)}
                        </TableCell>
                        <TableCell>
                          {euroFormatter.format(totalPrice(entry))}
                        </TableCell>
                        <TableCell className='font-mono text-xs'>
                          {entry.deliveryNote || '—'}
                        </TableCell>
                        <TableCell className='space-x-2 text-right'>
                          <Button asChild variant='outline' size='sm'>
                            <Link
                              href={buildMpmLink(entry.mpmKey)}
                              target='_blank'
                              rel='noreferrer'
                            >
                              {t('openMpm')}
                            </Link>
                          </Button>
                          {entry.imageUrl ? (
                            <Button asChild variant='ghost' size='sm'>
                              <Link
                                href={entry.imageUrl}
                                target='_blank'
                                rel='noreferrer'
                              >
                                {t('viewImage')}
                              </Link>
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
