'use client';

import { useEffect, useState } from 'react';
import { Plus, Droplet, Edit, Trash2, TrendingUp, TrendingDown, History } from 'lucide-react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ImageUpload } from '@/components/barrel-oils/image-upload';
import { OilGuideLinks } from '@/components/barrel-oils/oil-guide-links';
import { HistoryDialog } from '@/components/barrel-oils/history-dialog';
import { BarrelVisual } from '@/components/barrel-oils/barrel-visual';
import { CanisterVisual } from '@/components/barrel-oils/canister-visual';

type LiquidType = 'oil' | 'windshield_washer' | 'distilled_water' | 'adblue';

type BarrelOil = {
  id: string;
  brand: string;
  viscosity: string;
  liquid_type: LiquidType;
  dilution_ratio?: string;
  ean?: string;
  supplier?: string;
  article_number?: string;
  acea_specs?: string;
  approvals?: string;
  recommendations?: string;
  specifications?: string;
  barrel_size: number;
  max_capacity: number;
  current_level: number;
  purchase_price?: number;
  price_per_liter?: number;
  last_price?: number;
  location?: string;
  purchase_date?: string;
  notes?: string;
  image_url?: string;
  image_path?: string;
  created_at: string;
};

export default function BarrelOilsPage() {
  const supabase = createClient();
  const t = useTranslations('BarrelOils');

  const [mounted, setMounted] = useState(false);
  const [barrels, setBarrels] = useState<BarrelOil[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('employee');
  const [openDialog, setOpenDialog] = useState(false);
  const [openAdjustDialog, setOpenAdjustDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [editingBarrel, setEditingBarrel] = useState<BarrelOil | null>(null);
  const [adjustingBarrel, setAdjustingBarrel] = useState<BarrelOil | null>(null);
  const [deletingBarrel, setDeletingBarrel] = useState<BarrelOil | null>(null);
  const [historyBarrel, setHistoryBarrel] = useState<BarrelOil | null>(null);

  // Form state
  const [liquidType, setLiquidType] = useState<LiquidType>('oil');
  const [brand, setBrand] = useState('');
  const [viscosity, setViscosity] = useState('');
  const [ean, setEan] = useState('');
  const [supplier, setSupplier] = useState('');
  const [articleNumber, setArticleNumber] = useState('');
  const [aceaSpecs, setAceaSpecs] = useState('');
  const [approvals, setApprovals] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [barrelSize, setBarrelSize] = useState<number>(208);
  const [maxCapacity, setMaxCapacity] = useState<number>(208);
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [pricePerLiter, setPricePerLiter] = useState<number>(0);
  const [lastPrice, setLastPrice] = useState<number>(0);
  const [location, setLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [dilutionRatio, setDilutionRatio] = useState<string>('none');

  // Adjust form state
  const [adjustAmount, setAdjustAmount] = useState<number>(0);
  const [adjustPrice, setAdjustPrice] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustAction, setAdjustAction] = useState<'add' | 'remove'>('add');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    loadBarrels();
    loadUserRole();
  }, []);

  // Helper function: Calculate effective price per liter with dilution
  function calculateEffectivePricePerLiter(basePricePerLiter: number, ratio: string | undefined): number {
    if (!ratio || ratio === 'none') return basePricePerLiter;

    const ratioMap: Record<string, number> = {
      '1:1': 2,    // 1L Konzentrat + 1L Wasser = 2L → Preis halbiert
      '1:2': 3,    // 1L Konzentrat + 2L Wasser = 3L → Preis gedrittelt
      '1:3': 4,    // 1L Konzentrat + 3L Wasser = 4L → Preis geviertelt
      '1:4': 5,    // 1L Konzentrat + 4L Wasser = 5L → Preis gefünftelt
      '1:5': 6     // 1L Konzentrat + 5L Wasser = 6L → Preis gesechstelt
    };

    const multiplier = ratioMap[ratio] || 1;
    return basePricePerLiter / multiplier;
  }

  // Helper function: Get dynamic liquid label for buttons
  function getLiquidLabel(liquidType: LiquidType | null | undefined): string {
    if (!liquidType || liquidType === 'oil') return 'Öl';
    if (liquidType === 'windshield_washer') return 'Wasser';
    if (liquidType === 'distilled_water') return 'Wasser';
    if (liquidType === 'adblue') return 'AdBlue';
    return 'Öl';
  }

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

  // Automatische Literpreis-Berechnung
  useEffect(() => {
    if (purchasePrice > 0 && maxCapacity > 0) {
      const calculated = purchasePrice / maxCapacity;
      setPricePerLiter(parseFloat(calculated.toFixed(2)));
    }
  }, [purchasePrice, maxCapacity]);

  async function loadBarrels() {
    const { data, error } = await supabase
      .from('barrel_oils')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error(t('errorLoadBarrels'));
      console.error(error);
    } else {
      setBarrels(data || []);
    }
  }

  function resetForm() {
    setLiquidType('oil');
    setBrand('');
    setViscosity('');
    setEan('');
    setSupplier('');
    setArticleNumber('');
    setAceaSpecs('');
    setApprovals('');
    setRecommendations('');
    setSpecifications('');
    setBarrelSize(208);
    setMaxCapacity(208);
    setCurrentLevel(0);
    setPurchasePrice(0);
    setPricePerLiter(0);
    setLastPrice(0);
    setLocation('');
    setPurchaseDate('');
    setNotes('');
    setImageUrl('');
    setImagePath('');
    setDilutionRatio('none');
    setEditingBarrel(null);
  }

  function handleAddNew() {
    resetForm();
    setOpenDialog(true);
  }

  function handleEdit(barrel: BarrelOil) {
    setEditingBarrel(barrel);
    setLiquidType(barrel.liquid_type || 'oil');
    setBrand(barrel.brand);
    setViscosity(barrel.viscosity);
    setEan(barrel.ean || '');
    setSupplier(barrel.supplier || '');
    setArticleNumber(barrel.article_number || '');
    setAceaSpecs(barrel.acea_specs || '');
    setApprovals(barrel.approvals || '');
    setRecommendations(barrel.recommendations || '');
    setSpecifications(barrel.specifications || '');
    setBarrelSize(barrel.barrel_size);
    setMaxCapacity(barrel.max_capacity);
    setCurrentLevel(barrel.current_level);
    setPurchasePrice(barrel.purchase_price || 0);
    setPricePerLiter(barrel.price_per_liter || 0);
    setLastPrice(barrel.last_price || 0);
    setLocation(barrel.location || '');
    setPurchaseDate(barrel.purchase_date || '');
    setNotes(barrel.notes || '');
    setImageUrl(barrel.image_url || '');
    setImagePath(barrel.image_path || '');
    setDilutionRatio(barrel.dilution_ratio || 'none');
    setOpenDialog(true);
  }

  function handleAdjust(barrel: BarrelOil, action: 'add' | 'remove') {
    setAdjustingBarrel(barrel);
    setAdjustAction(action);
    setAdjustAmount(0);
    setAdjustPrice(barrel.price_per_liter || 0);
    setAdjustReason('');
    setOpenAdjustDialog(true);
  }

  function handleDelete(barrel: BarrelOil) {
    setDeletingBarrel(barrel);
    setOpenDeleteDialog(true);
  }

  function handleShowHistory(barrel: BarrelOil) {
    setHistoryBarrel(barrel);
    setOpenHistoryDialog(true);
  }

  async function handleSave() {
    try {
      setLoading(true);

      // Validation: Brand always required, viscosity only for oil
      if (!brand || (liquidType === 'oil' && !viscosity)) {
        toast.error(t('errorRequiredFields'));
        return;
      }

      if (currentLevel > maxCapacity) {
        toast.error(t('errorExceedsCapacity'));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      const barrelData = {
        liquid_type: liquidType,
        dilution_ratio: (liquidType === 'windshield_washer' && dilutionRatio !== 'none') ? dilutionRatio : null,
        brand,
        viscosity,
        ean: ean || null,
        supplier: supplier || null,
        article_number: articleNumber || null,
        acea_specs: liquidType === 'oil' ? (aceaSpecs || null) : null,
        approvals: liquidType === 'oil' ? (approvals || null) : null,
        recommendations: liquidType === 'oil' ? (recommendations || null) : null,
        specifications: liquidType === 'oil' ? (specifications || null) : null,
        barrel_size: barrelSize,
        max_capacity: maxCapacity,
        current_level: currentLevel,
        purchase_price: purchasePrice || null,
        price_per_liter: pricePerLiter || null,
        last_price: lastPrice || null,
        location: location || null,
        purchase_date: purchaseDate || null,
        notes: notes || null,
        image_url: imageUrl || null,
        image_path: imagePath || null,
        created_by: user?.id
      };

      if (editingBarrel) {
        const { error } = await supabase
          .from('barrel_oils')
          .update(barrelData)
          .eq('id', editingBarrel.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('barrel_oils')
          .insert([barrelData]);

        if (error) throw error;
      }

      toast.success(t('successSaved'));
      setOpenDialog(false);
      resetForm();
      loadBarrels();
    } catch (error: any) {
      toast.error(t('errorSaveBarrel'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdjustSave() {
    try {
      if (!adjustingBarrel) return;

      setLoading(true);

      if (!adjustAmount || adjustAmount <= 0) {
        toast.error(t('errorAdjustAmount'));
        setLoading(false);
        return;
      }

      // Preis nur bei Zugang erforderlich
      if (adjustAction === 'add' && (!adjustPrice || adjustPrice <= 0)) {
        toast.error(t('errorAdjustPrice'));
        setLoading(false);
        return;
      }

      const newLevel = adjustAction === 'add'
        ? adjustingBarrel.current_level + adjustAmount
        : adjustingBarrel.current_level - adjustAmount;

      if (newLevel < 0) {
        toast.error(t('errorInsufficientOil'));
        return;
      }

      if (newLevel > adjustingBarrel.max_capacity) {
        toast.error(t('errorExceedsCapacity'));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Update barrel level
      const { error: updateError } = await supabase
        .from('barrel_oils')
        .update({ current_level: newLevel })
        .eq('id', adjustingBarrel.id);

      if (updateError) throw updateError;

      // Log history
      const userName = user?.user_metadata?.first_name && user?.user_metadata?.last_name
        ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim()
        : user?.email || 'System';

      const totalCost = adjustAction === 'add' ? adjustAmount * adjustPrice : 0;

      const { error: historyError } = await supabase
        .from('barrel_oil_history')
        .insert([{
          barrel_id: adjustingBarrel.id,
          action: adjustAction,
          amount: adjustAmount,
          old_level: adjustingBarrel.current_level,
          new_level: newLevel,
          unit_price: adjustAction === 'add' ? adjustPrice : null,
          total_cost: adjustAction === 'add' ? totalCost : null,
          reason: adjustReason || null,
          user_name: userName,
          user_id: user?.id
        }]);

      if (historyError) throw historyError;

      toast.success(t('successAdjusted'));
      setOpenAdjustDialog(false);
      setAdjustingBarrel(null);
      loadBarrels();
    } catch (error: any) {
      toast.error(t('errorAdjustLevel'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  async function confirmDelete() {
    try {
      if (!deletingBarrel) return;

      setLoading(true);

      // Bild aus Storage löschen
      if (deletingBarrel.image_path) {
        await supabase.storage
          .from('barrel-oils')
          .remove([deletingBarrel.image_path]);
      }

      const { error } = await supabase
        .from('barrel_oils')
        .delete()
        .eq('id', deletingBarrel.id);

      if (error) throw error;

      toast.success(t('successDeleted'));
      setOpenDeleteDialog(false);
      setDeletingBarrel(null);
      loadBarrels();
    } catch (error: any) {
      toast.error(t('errorDeleteBarrel'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function getFillPercentage(barrel: BarrelOil) {
    return (barrel.current_level / barrel.max_capacity) * 100;
  }

  function getFillColor(percentage: number) {
    if (percentage < 20) return 'bg-red-500';
    if (percentage < 50) return 'bg-orange-500';
    return 'bg-green-500';
  }

  if (!mounted) return null;

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col gap-8'>

        {/* Page Header */}
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>{t('title')}</h1>
            <p className='text-muted-foreground text-sm'>{t('barrelManagement')}</p>
          </div>
          <div className='flex flex-wrap items-center gap-3'>
            <div className='flex items-center gap-2'>
              <span className='text-muted-foreground hidden text-sm font-medium sm:block'>{t('oilGuideLabel')}</span>
              <OilGuideLinks />
            </div>
            {(userRole === 'admin' || userRole === 'manager') && (
              <Button onClick={handleAddNew} size='sm' className='h-9 gap-2'>
                <Plus className='h-4 w-4' />
                {t('addLiquid')}
              </Button>
            )}
          </div>
        </div>

        {/* Barrels Grid */}
        {barrels.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20 text-center'>
            <Droplet className='text-muted-foreground/40 mb-4 h-12 w-12' />
            <h3 className='mb-1 text-base font-semibold'>{t('noBarrels')}</h3>
            <p className='text-muted-foreground mb-6 max-w-sm text-sm'>{t('addFirst')}</p>
            {(userRole === 'admin' || userRole === 'manager') && (
              <Button onClick={handleAddNew} size='sm' className='h-9 gap-2'>
                <Plus className='h-4 w-4' />
                {t('addBarrel')}
              </Button>
            )}
          </div>
        ) : (
          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {barrels.map((barrel) => (
              <div
                key={barrel.id}
                className='flex flex-col overflow-hidden rounded-xl border border-border bg-card'
              >
                {/* Image */}
                {barrel.image_url && (
                  <div className='bg-muted/30 flex h-32 items-center justify-center'>
                    <img
                      src={barrel.image_url}
                      alt={barrel.brand}
                      className='h-24 w-auto max-w-full object-contain'
                    />
                  </div>
                )}

                <div className='flex flex-1 flex-col gap-3 p-4'>
                  {/* Header */}
                  <div className='flex items-start justify-between gap-2'>
                    <h3 className='font-semibold leading-tight'>{barrel.brand}</h3>
                    <span className='text-muted-foreground bg-muted shrink-0 rounded-md px-2 py-0.5 text-xs font-medium'>
                      {barrel.barrel_size}L
                    </span>
                  </div>

                  {/* Viscosity / Type */}
                  {barrel.viscosity && (
                    <span className='inline-flex w-fit rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary'>
                      {barrel.viscosity}
                    </span>
                  )}

                  {/* Supplier / Article */}
                  {(barrel.supplier || barrel.article_number) && (
                    <div className='text-muted-foreground space-y-0.5 text-xs'>
                      {barrel.supplier && (
                        <div>{t('supplier')}: <span className='text-foreground font-medium'>{barrel.supplier}</span></div>
                      )}
                      {barrel.article_number && (
                        <div>{t('articleNumberShort')}: <span className='text-foreground font-medium'>{barrel.article_number}</span></div>
                      )}
                    </div>
                  )}

                  {/* Price info */}
                  {(barrel.last_price || barrel.price_per_liter) && (
                    <div className='flex gap-2'>
                      {barrel.last_price && (
                        <div className='flex-1 rounded-lg border border-border p-2'>
                          <div className='text-muted-foreground text-[10px]'>{t('current')}</div>
                          <div className='text-sm font-semibold text-emerald-600 dark:text-emerald-400'>
                            {calculateEffectivePricePerLiter(barrel.last_price, barrel.dilution_ratio).toFixed(2)} €/L
                          </div>
                          {barrel.dilution_ratio && barrel.dilution_ratio !== 'none' && (
                            <div className='text-muted-foreground text-[10px]'>{t('diluted')} {barrel.dilution_ratio}</div>
                          )}
                        </div>
                      )}
                      {barrel.price_per_liter && barrel.price_per_liter !== barrel.last_price && (
                        <div className='flex-1 rounded-lg border border-border p-2'>
                          <div className='text-muted-foreground text-[10px]'>{t('purchase')}</div>
                          <div className='text-primary text-sm font-semibold'>
                            {calculateEffectivePricePerLiter(barrel.price_per_liter, barrel.dilution_ratio).toFixed(2)} €/L
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Specs */}
                  {(barrel.acea_specs || barrel.approvals || barrel.recommendations) && (
                    <div className='bg-muted/50 space-y-0.5 rounded-lg px-3 py-2 text-xs'>
                      {barrel.acea_specs && (
                        <div>
                          <span className='font-semibold text-primary'>{t('aceaLabel')} </span>
                          <span className='text-muted-foreground'>{barrel.acea_specs}</span>
                        </div>
                      )}
                      {barrel.approvals && (
                        <div>
                          <span className='font-semibold text-primary'>{t('approvalsLabel')} </span>
                          <span className='text-muted-foreground'>{barrel.approvals}</span>
                        </div>
                      )}
                      {barrel.recommendations && (
                        <div>
                          <span className='font-semibold text-primary'>{t('recommendationsLabel')} </span>
                          <span className='text-muted-foreground'>{barrel.recommendations}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Fill Level Visual */}
                  <div>
                    {!barrel.liquid_type || barrel.liquid_type === 'oil' ? (
                      <BarrelVisual
                        currentLevel={barrel.current_level}
                        maxCapacity={barrel.max_capacity}
                        barrelSize={barrel.barrel_size}
                      />
                    ) : (
                      <CanisterVisual
                        currentLevel={barrel.current_level}
                        maxCapacity={barrel.max_capacity}
                        canisterSize={barrel.barrel_size}
                        liquidType={barrel.liquid_type}
                      />
                    )}
                  </div>

                  {/* Location */}
                  {barrel.location && (
                    <div className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                      <svg className='h-3 w-3 shrink-0' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2.5} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                      </svg>
                      {barrel.location}
                    </div>
                  )}

                  {/* Actions */}
                  <div className='mt-auto flex flex-col gap-2 pt-1'>
                    <div className='flex gap-2'>
                      {(userRole === 'admin' || userRole === 'manager') && (
                        <Button
                          size='sm'
                          className='h-9 flex-1 gap-1.5'
                          onClick={() => handleAdjust(barrel, 'add')}
                        >
                          <TrendingUp className='h-3.5 w-3.5' />
                          {getLiquidLabel(barrel.liquid_type)} +
                        </Button>
                      )}
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-9 flex-1 gap-1.5'
                        onClick={() => handleAdjust(barrel, 'remove')}
                      >
                        <TrendingDown className='h-3.5 w-3.5' />
                        {getLiquidLabel(barrel.liquid_type)} -
                      </Button>
                    </div>
                    <div className='flex gap-1'>
                      <Button
                        size='sm'
                        variant='ghost'
                        className='h-9 flex-1 gap-1.5 text-xs'
                        onClick={() => handleShowHistory(barrel)}
                      >
                        <History className='h-3.5 w-3.5' />
                        {t('history')}
                      </Button>
                      {(userRole === 'admin' || userRole === 'manager') && (
                        <Button
                          size='sm'
                          variant='ghost'
                          className='h-9 w-9 p-0'
                          onClick={() => handleEdit(barrel)}
                        >
                          <Edit className='h-3.5 w-3.5' />
                        </Button>
                      )}
                      {userRole === 'admin' && (
                        <Button
                          size='sm'
                          variant='ghost'
                          className='text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 p-0'
                          onClick={() => handleDelete(barrel)}
                        >
                          <Trash2 className='h-3.5 w-3.5' />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
            <DialogHeader>
              <DialogTitle>
                {editingBarrel ? t('editLiquid') : t('addLiquid')}
              </DialogTitle>
            </DialogHeader>

            <div className='space-y-4'>
              {/* Flüssigkeitstyp Auswahl */}
              <div>
                <label className='mb-1 block text-sm font-medium'>{t('liquidType')}</label>
                <Select value={liquidType} onValueChange={(val) => setLiquidType(val as LiquidType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='oil'>{t('oilBarrel')}</SelectItem>
                    <SelectItem value='windshield_washer'>{t('windshieldWasherCanister')}</SelectItem>
                    <SelectItem value='distilled_water'>{t('distilledWaterCanister')}</SelectItem>
                    <SelectItem value='adblue'>{t('adBlueCanister')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Image Upload */}
              <ImageUpload
                currentImage={imageUrl}
                onImageUploaded={(url, path) => {
                  setImageUrl(url);
                  setImagePath(path);
                }}
                onImageRemoved={() => {
                  setImageUrl('');
                  setImagePath('');
                }}
              />

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('brand')}</label>
                  <Input
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder={t('brandPlaceholder')}
                  />
                </div>

                {liquidType === 'oil' ? (
                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('viscosity')}</label>
                    <Input
                      value={viscosity}
                      onChange={(e) => setViscosity(e.target.value)}
                      placeholder={t('viscosityPlaceholder')}
                    />
                  </div>
                ) : liquidType === 'windshield_washer' ? (
                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('dilution')}</label>
                    <Select value={dilutionRatio} onValueChange={setDilutionRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='none'>{t('noDilution')}</SelectItem>
                        <SelectItem value='1:1'>{t('dilution1to1')}</SelectItem>
                        <SelectItem value='1:2'>{t('dilution1to2')}</SelectItem>
                        <SelectItem value='1:3'>{t('dilution1to3')}</SelectItem>
                        <SelectItem value='1:4'>{t('dilution1to4')}</SelectItem>
                        <SelectItem value='1:5'>{t('dilution1to5')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : liquidType === 'distilled_water' ? (
                  <div className='flex items-center py-2'>
                    <span className='text-sm text-muted-foreground italic'>
                      {t('distilledWaterPure')}
                    </span>
                  </div>
                ) : liquidType === 'adblue' ? (
                  <div className='flex items-center py-2'>
                    <span className='text-sm text-muted-foreground italic'>
                      {t('adBlueCanister')}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('supplier')}</label>
                  <Input
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    placeholder='z.B. Stahlgruber, STAKIS'
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('articleNumber')}</label>
                  <Input
                    value={articleNumber}
                    onChange={(e) => setArticleNumber(e.target.value)}
                    placeholder='z.B. 12345678'
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('barrelSize')}</label>
                  <Select
                    value={String(barrelSize)}
                    onValueChange={(val) => {
                      const size = parseInt(val);
                      setBarrelSize(size);
                      setMaxCapacity(size);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='60'>{t('barrel60L')}</SelectItem>
                      <SelectItem value='120'>{t('barrel120L')}</SelectItem>
                      <SelectItem value='208'>{t('barrel208L')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('maxCapacity')}</label>
                  <Input
                    type='number'
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('currentLevel')}</label>
                  <Input
                    type='number'
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('pricePerLiterCurrent')}</label>
                  <Input
                    type='number'
                    step='0.0001'
                    value={lastPrice}
                    onChange={(e) => setLastPrice(parseFloat(e.target.value) || 0)}
                    placeholder='0.0000'
                  />
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('purchasePrice')}</label>
                  <Input
                    type='number'
                    step='0.01'
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('pricePerLiter')} ({t('calculated')})</label>
                  <Input
                    type='number'
                    step='0.0001'
                    value={pricePerLiter}
                    disabled
                    className='bg-muted'
                  />
                </div>
              </div>

              {/* Öl-spezifische Felder nur bei Öl anzeigen */}
              {liquidType === 'oil' && (
                <>
                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('aceaSpecs')}</label>
                    <Input
                      value={aceaSpecs}
                      onChange={(e) => setAceaSpecs(e.target.value)}
                      placeholder={t('aceaSpecsPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('approvals')}</label>
                    <Input
                      value={approvals}
                      onChange={(e) => setApprovals(e.target.value)}
                      placeholder={t('approvalsPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('recommendations')}</label>
                    <Input
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder={t('recommendationsPlaceholder')}
                    />
                  </div>
                </>
              )}

              {/* Spezifikationen nur bei Öl anzeigen */}
              {liquidType === 'oil' && (
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('specifications')}</label>
                  <Textarea
                    value={specifications}
                    onChange={(e) => setSpecifications(e.target.value)}
                    placeholder={t('specificationsPlaceholder')}
                    rows={2}
                  />
                </div>
              )}

              {/* EAN Feld für alle Flüssigkeitstypen */}
              <div>
                <label className='mb-1 block text-sm font-medium'>{t('ean')}</label>
                <Input
                  value={ean}
                  onChange={(e) => setEan(e.target.value)}
                  placeholder='z.B. 4005800338953'
                />
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('location')}</label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t('locationPlaceholder')}
                  />
                </div>

                <div>
                  <label className='mb-1 block text-sm font-medium'>{t('purchaseDate')}</label>
                  <Input
                    type='date'
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium'>{t('notes')}</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  rows={3}
                />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setOpenDialog(false);
                    resetForm();
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? '...' : t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Adjust Level Dialog */}
        <Dialog open={openAdjustDialog} onOpenChange={setOpenAdjustDialog}>
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>
                {adjustAction === 'add'
                  ? `${getLiquidLabel(adjustingBarrel?.liquid_type)} hinzufügen`
                  : `${getLiquidLabel(adjustingBarrel?.liquid_type)} entnehmen`
                }
              </DialogTitle>
              <DialogDescription>
                {adjustingBarrel?.brand}
                {adjustingBarrel?.liquid_type === 'oil' && adjustingBarrel?.viscosity
                  ? ` - ${adjustingBarrel.viscosity}`
                  : ''
                }
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium'>{t('amount')}</label>
                <Input
                  type='number'
                  value={adjustAmount || ''}
                  onChange={(e) => setAdjustAmount(parseFloat(e.target.value) || 0)}
                  placeholder={t('amountPlaceholder')}
                  step='0.1'
                  inputMode='decimal'
                  autoFocus={false}
                />
              </div>

              {/* Preis nur bei Zugang anzeigen */}
              {adjustAction === 'add' && (
                <>
                  <div>
                    <label className='mb-1 block text-sm font-medium'>{t('pricePerLiterCurrent')}</label>
                    <Input
                      type='number'
                      step='0.0001'
                      value={adjustPrice || ''}
                      onChange={(e) => setAdjustPrice(parseFloat(e.target.value) || 0)}
                      placeholder='0.00'
                      inputMode='decimal'
                    />
                  </div>

                  {adjustAmount > 0 && adjustPrice > 0 && (
                    <div className='bg-muted rounded-lg p-3'>
                      <p className='text-sm font-medium'>
                        {t('totalCost')}: {(adjustAmount * adjustPrice).toFixed(2)} €
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <label className='mb-1 block text-sm font-medium'>{t('reason')}</label>
                <Textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder={t('reasonPlaceholder')}
                  rows={3}
                />
              </div>

              <div className='flex justify-end gap-2 pt-4'>
                <Button
                  variant='outline'
                  onClick={() => setOpenAdjustDialog(false)}
                >
                  {t('cancel')}
                </Button>
                <Button onClick={handleAdjustSave} disabled={loading}>
                  {loading ? '...' : t('confirm')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('deleteConfirmMessage')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className='bg-destructive text-destructive-foreground hover:bg-destructive/90'>
                {t('delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* History Dialog */}
        {historyBarrel && (
          <HistoryDialog
            open={openHistoryDialog}
            onOpenChange={setOpenHistoryDialog}
            barrelId={historyBarrel.id}
            barrelName={`${historyBarrel.brand} ${historyBarrel.viscosity}`}
          />
        )}
      </div>
    </PageContainer>
  );
}
