'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Smartphone, HardDrive, Palette, Wrench, Battery, Package, MapPin, Plus, X, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn, calculateCommission, calculateNetPayout } from '@/lib/utils';

const iphoneModels = [
  'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max',
  'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro',
  'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12',
  'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11', 'iPhone XR', 'iPhone X',
];

const storageOptions = [64, 128, 256, 512, 1024];

const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
];

const wilayas = [
  'Algiers', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Setif',
  'Batna', 'Djelfa', 'Tlemcen', 'Bejaia', 'Mostaganem', 'Skikda',
];

export default function CreateListingPage() {
  const t = useTranslations('listings.create');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [photos, setPhotos] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    model: '',
    storage: '',
    color: '',
    condition: '',
    batteryHealth: '',
    description: '',
    accessories: '',
    originalBox: false,
    warrantyRemaining: '0',
    imei: '',
    listingType: 'fixed',
    startingPrice: '',
    buyNowPrice: '',
    reservePrice: '',
    duration: '60',
    wilaya: '',
    city: '',
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = useCallback(() => {
    const newPhotos = ['/placeholder-phone.jpg', '/placeholder-phone.jpg', '/placeholder-phone.jpg'];
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 10));
  }, []);

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const canProceed = useCallback(() => {
    switch (step) {
      case 1: return photos.length >= 3;
      case 2: return formData.model && formData.storage && formData.condition && formData.batteryHealth;
      case 3: return formData.startingPrice && formData.wilaya;
      default: return true;
    }
  }, [step, photos, formData]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success(t('success'));
      router.push('/listings');
    } catch {
      toast.error(t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, label: t('step1'), icon: Camera },
    { num: 2, label: t('step2'), icon: Smartphone },
    { num: 3, label: t('step3'), icon: HardDrive },
  ];

  const commission = formData.startingPrice ? calculateCommission(parseInt(formData.startingPrice)) : 0;
  const netPayout = formData.startingPrice ? calculateNetPayout(parseInt(formData.startingPrice)) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Listings
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              step >= s.num
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
            )}>
              {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
            </div>
            <span className={cn(
              'text-sm font-medium hidden sm:block',
              step >= s.num ? 'text-gray-900 dark:text-white' : 'text-gray-400'
            )}>{s.label}</span>
            {i < steps.length - 1 && (
              <div className={cn('flex-1 h-0.5', step > s.num ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700')} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{t('photos.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('photos.subtitle')}</p>
            </div>

            <div
              onClick={handlePhotoUpload}
              className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-600 transition-colors"
            >
              <Camera className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('photos.dragDrop')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('photos.orBrowse')}</p>
            </div>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {photos.map((photo, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                    <Image src={photo} alt={`Photo ${i + 1}`} fill className="object-cover" sizes="120px" />
                    <button
                      onClick={(e) => { e.stopPropagation(); removePhoto(i); }}
                      className="absolute top-1 right-1 p-1 bg-error-500 text-white rounded-full hover:bg-error-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400">{t('photos.photoTips')}</p>
            <p className={cn('text-xs', photos.length >= 3 ? 'text-success-600' : 'text-warning-600')}>
              {photos.length}/10 photos {photos.length < 3 ? `(min 3 required)` : ''}
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('details.title')}</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.model')}</label>
                <select
                  value={formData.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('details.modelPlaceholder')}</option>
                  {iphoneModels.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.storage')}</label>
                <select
                  value={formData.storage}
                  onChange={(e) => updateField('storage', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('details.storagePlaceholder')}</option>
                  {storageOptions.map((s) => <option key={s} value={s}>{s >= 1024 ? '1TB' : `${s}GB`}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.color')}</label>
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => updateField('color', e.target.value)}
                  placeholder={t('details.colorPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.condition')}</label>
                <select
                  value={formData.condition}
                  onChange={(e) => updateField('condition', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('details.conditionPlaceholder')}</option>
                  {conditions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.batteryHealth')}</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.batteryHealth}
                  onChange={(e) => updateField('batteryHealth', e.target.value)}
                  placeholder={t('details.batteryPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.warrantyRemaining')}</label>
                <input
                  type="number"
                  min="0"
                  value={formData.warrantyRemaining}
                  onChange={(e) => updateField('warrantyRemaining', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.description')}</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder={t('details.descriptionPlaceholder')}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('details.accessories')}</label>
              <input
                type="text"
                value={formData.accessories}
                onChange={(e) => updateField('accessories', e.target.value)}
                placeholder={t('details.accessoriesPlaceholder')}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.originalBox}
                onChange={(e) => updateField('originalBox', e.target.checked)}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{t('details.originalBox')}</span>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('pricing.title')}</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{t('pricing.listingType')}</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'fixed', label: t('pricing.fixedPrice') },
                  { value: 'auction', label: t('pricing.auction') },
                  { value: 'both', label: t('pricing.buyNow') },
                ].map((type) => (
                  <button
                    key={type.value}
                    onClick={() => updateField('listingType', type.value)}
                    className={cn(
                      'p-3 rounded-lg border text-sm font-medium transition-colors',
                      formData.listingType === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('pricing.startingPrice')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.startingPrice}
                    onChange={(e) => updateField('startingPrice', e.target.value)}
                    placeholder={t('pricing.startingPricePlaceholder')}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">DZD</span>
                </div>
              </div>

              {(formData.listingType === 'both' || formData.listingType === 'fixed') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('pricing.buyNowPrice')}</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.buyNowPrice}
                      onChange={(e) => updateField('buyNowPrice', e.target.value)}
                      placeholder={t('pricing.buyNowPricePlaceholder')}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">DZD</span>
                  </div>
                </div>
              )}

              {formData.listingType === 'auction' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('pricing.duration')}</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => updateField('duration', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="360">6 hours</option>
                    <option value="1440">24 hours</option>
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('location.wilaya')}</label>
                <select
                  value={formData.wilaya}
                  onChange={(e) => updateField('wilaya', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('location.wilayaPlaceholder')}</option>
                  {wilayas.map((w) => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('location.city')}</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder={t('location.cityPlaceholder')}
                  className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {formData.startingPrice && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('pricing.commission')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{commission.toLocaleString()} DZD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('pricing.netPayout')}</span>
                  <span className="font-medium text-success-600 dark:text-success-400">{netPayout.toLocaleString()} DZD</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">{t('pricing.commissionNote')}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Previous
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => canProceed() && setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="px-8 py-2.5 bg-success-600 text-white rounded-lg text-sm font-medium hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              {t('submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
