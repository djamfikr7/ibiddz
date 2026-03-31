'use client';

import { useTranslations } from 'next-intl';
import { UserTable } from '@/components/admin/UserTable';

export default function AdminUsersPage() {
  const t = useTranslations('admin');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Manage users, trust scores, and access</p>
      </div>
      <UserTable />
    </div>
  );
}
