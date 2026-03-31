'use client';

import { useTranslations } from 'next-intl';
import { DisputeCard } from '@/components/admin/DisputeCard';

export default function AdminDisputesPage() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('disputes.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Resolve buyer-seller disputes and manage SLAs</p>
      </div>
      <DisputeCard />
    </div>
  );
}
