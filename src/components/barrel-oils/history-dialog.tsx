'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { useTranslations } from 'next-intl';
import { TrendingUp, TrendingDown, Calendar, User, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

interface HistoryEntry {
  id: string;
  created_at: string;
  action: 'add' | 'remove';
  amount: number;
  old_level: number;
  new_level: number;
  unit_price?: number;
  total_cost?: number;
  reason?: string;
  user_name?: string;
}

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barrelId: string;
  barrelName: string;
}

export function HistoryDialog({ open, onOpenChange, barrelId, barrelName }: HistoryDialogProps) {
  const supabase = createClient();
  const t = useTranslations('BarrelOils');
  const tCommon = useTranslations('common');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('employee');
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    if (open) {
      loadHistory();
      loadUserRole();
    }
  }, [open, barrelId]);

  async function loadUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserRole(data.role);
      }
    }
  }

  async function loadHistory() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('barrel_oil_history')
        .select('*')
        .eq('barrel_id', barrelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  }

  const additions = history.filter((h) => h.action === 'add');
  const removals = history.filter((h) => h.action === 'remove');

  const totalAddedLiters = additions.reduce((sum, h) => sum + h.amount, 0);
  const totalRemovedLiters = removals.reduce((sum, h) => sum + h.amount, 0);
  const totalAddedCost = additions.reduce((sum, h) => sum + (h.total_cost || 0), 0);
  const totalRemovedCost = removals.reduce((sum, h) => sum + (h.total_cost || 0), 0);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function handleEdit(entry: HistoryEntry) {
    if (userRole !== 'admin') return;
    setEditingEntry(entry);
  }

  async function saveEdit() {
    if (!editingEntry) return;

    try {
      const { error } = await supabase
        .from('barrel_oil_history')
        .update({
          amount: editingEntry.amount,
          unit_price: editingEntry.unit_price,
          total_cost: editingEntry.total_cost,
          reason: editingEntry.reason
        })
        .eq('id', editingEntry.id);

      if (error) throw error;

      toast.success(tCommon('saved'));
      setEditingEntry(null);
      loadHistory();
    } catch (error: any) {
      toast.error(tCommon('error') + ': ' + error.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;

    try {
      const { error } = await supabase
        .from('barrel_oil_history')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      toast.success(tCommon('deleted'));
      setDeleteTarget(null);
      loadHistory();
    } catch (error: any) {
      toast.error(tCommon('error') + ': ' + error.message);
    }
  }

  function renderHistoryList(entries: HistoryEntry[], type: 'add' | 'remove') {
    if (entries.length === 0) {
      return (
        <div className='text-muted-foreground flex h-32 items-center justify-center text-sm'>
          {t(type === 'add' ? 'noAdditions' : 'noRemovals')}
        </div>
      );
    }

    return (
      <div className='space-y-3'>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className='border-border hover:bg-accent/50 rounded-lg border p-4 transition-colors'
          >
            <div className='mb-2 flex items-start justify-between'>
              <div className='flex items-center gap-2'>
                {type === 'add' ? (
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                    <TrendingUp className='h-4 w-4 text-green-600 dark:text-green-400' />
                  </div>
                ) : (
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
                    <TrendingDown className='h-4 w-4 text-red-600 dark:text-red-400' />
                  </div>
                )}
                <div>
                  <p className='font-semibold'>
                    {entry.amount.toFixed(2)} {t('liters')}
                  </p>
                  {entry.unit_price && (
                    <p className='text-muted-foreground text-xs'>
                      {entry.unit_price.toFixed(4)} € / {t('liter')}
                    </p>
                  )}
                </div>
              </div>

              <div className='flex items-center gap-2'>
                {entry.total_cost && (
                  <Badge variant='outline' className='text-sm font-semibold'>
                    {entry.total_cost.toFixed(2)} €
                  </Badge>
                )}

                {/* Admin Edit/Delete Buttons */}
                {userRole === 'admin' && (
                  <div className='flex gap-1'>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='h-8 w-8 p-0'
                      onClick={() => handleEdit(entry)}
                    >
                      <Pencil className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      className='text-destructive hover:bg-destructive/10 h-8 w-8 p-0'
                      onClick={() => setDeleteTarget(entry)}
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className='text-muted-foreground space-y-1 text-xs'>
              <div className='flex items-center gap-2'>
                <Calendar className='h-3 w-3' />
                <span>{formatDate(entry.created_at)}</span>
              </div>

              {entry.user_name && (
                <div className='flex items-center gap-2'>
                  <User className='h-3 w-3' />
                  <span>{entry.user_name}</span>
                </div>
              )}

              {entry.reason && (
                <p className='text-foreground/70 mt-2 text-sm italic'>"{entry.reason}"</p>
              )}

              <p className='text-muted-foreground mt-1 text-xs'>
                {entry.old_level.toFixed(2)} L → {entry.new_level.toFixed(2)} L
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-3xl'>
        <DialogHeader>
          <DialogTitle>{t('historyTitle', { name: barrelName })}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className='flex h-64 items-center justify-center'>
            <div className='h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary' />
          </div>
        ) : (
          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='all'>{t('historyAll')}</TabsTrigger>
              <TabsTrigger value='additions'>{t('historyAdditions')}</TabsTrigger>
              <TabsTrigger value='removals'>{t('historyRemovals')}</TabsTrigger>
            </TabsList>

            <TabsContent value='all' className='space-y-4'>
              {/* Zusammenfassung */}
              <div className='grid gap-4 sm:grid-cols-2'>
                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <TrendingUp className='h-4 w-4 text-green-600' />
                      {t('totalAdditions')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-2xl font-bold'>{totalAddedLiters.toFixed(2)} L</p>
                    <p className='text-muted-foreground text-sm'>{totalAddedCost.toFixed(2)} €</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className='pb-2'>
                    <CardTitle className='flex items-center gap-2 text-sm'>
                      <TrendingDown className='h-4 w-4 text-red-600' />
                      {t('totalRemovals')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className='text-2xl font-bold'>{totalRemovedLiters.toFixed(2)} L</p>
                    <p className='text-muted-foreground text-sm'>{totalRemovedCost.toFixed(2)} €</p>
                  </CardContent>
                </Card>
              </div>

              {/* Alle Einträge */}
              <div className='space-y-3'>
                {history.length === 0 ? (
                  <div className='text-muted-foreground flex h-32 items-center justify-center text-sm'>
                    {t('noHistory')}
                  </div>
                ) : (
                  renderHistoryList(history, history[0]?.action)
                )}
              </div>
            </TabsContent>

            <TabsContent value='additions' className='space-y-4'>
              {/* Zusammenfassung Zubuchungen */}
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    <TrendingUp className='h-4 w-4 text-green-600' />
                    {t('totalAdditions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-2xl font-bold'>{totalAddedLiters.toFixed(2)} L</p>
                  <p className='text-muted-foreground text-sm'>{totalAddedCost.toFixed(2)} €</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {additions.length} {t('transactions')}
                  </p>
                </CardContent>
              </Card>

              {renderHistoryList(additions, 'add')}
            </TabsContent>

            <TabsContent value='removals' className='space-y-4'>
              {/* Zusammenfassung Entnahmen */}
              <Card>
                <CardHeader className='pb-2'>
                  <CardTitle className='flex items-center gap-2 text-sm'>
                    <TrendingDown className='h-4 w-4 text-red-600' />
                    {t('totalRemovals')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className='text-2xl font-bold'>{totalRemovedLiters.toFixed(2)} L</p>
                  <p className='text-muted-foreground text-sm'>{totalRemovedCost.toFixed(2)} €</p>
                  <p className='text-muted-foreground mt-1 text-xs'>
                    {removals.length} {t('transactions')}
                  </p>
                </CardContent>
              </Card>

              {renderHistoryList(removals, 'remove')}
            </TabsContent>
          </Tabs>
        )}

        {/* Edit Dialog */}
        {editingEntry && (
          <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
            <DialogContent className='sm:max-w-md'>
              <DialogHeader>
                <DialogTitle>Eintrag bearbeiten</DialogTitle>
              </DialogHeader>

              <div className='space-y-4'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>Menge (Liter)</label>
                  <Input
                    type='number'
                    step='0.01'
                    value={editingEntry.amount}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        amount: parseFloat(e.target.value) || 0,
                        total_cost: (parseFloat(e.target.value) || 0) * (editingEntry.unit_price || 0)
                      })
                    }
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>Preis pro Liter (€)</label>
                  <Input
                    type='number'
                    step='0.0001'
                    value={editingEntry.unit_price || 0}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        unit_price: parseFloat(e.target.value) || 0,
                        total_cost: editingEntry.amount * (parseFloat(e.target.value) || 0)
                      })
                    }
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>Gesamtkosten (€)</label>
                  <Input
                    type='number'
                    step='0.01'
                    value={editingEntry.total_cost?.toFixed(2) || '0.00'}
                    disabled
                    className='bg-muted'
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>Kommentar</label>
                  <Textarea
                    value={editingEntry.reason || ''}
                    onChange={(e) =>
                      setEditingEntry({
                        ...editingEntry,
                        reason: e.target.value
                      })
                    }
                    rows={3}
                  />
                </div>

                <div className='flex justify-end gap-2 pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => setEditingEntry(null)}
                  >
                    {tCommon('cancel')}
                  </Button>
                  <Button onClick={saveEdit}>
                    {tCommon('save')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Dieser Vorgang kann nicht rückgängig gemacht werden. Der Historieneintrag wird dauerhaft gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                {tCommon('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
}
