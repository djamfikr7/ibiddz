'use client';

import { useTranslations } from 'next-intl';
import { ListingModerationCard } from '@/components/admin/ListingModerationCard';

export default function AdminListingsPage() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('listings.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Review and moderate platform listings</p>
      </div>
      <ListingModerationCard />
    </div>
  );
}
