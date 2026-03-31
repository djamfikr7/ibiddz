'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, Filter, Ban, Shield, UserX, CheckCircle, MoreHorizontal, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTrustTierLabel } from '@/lib/utils';
import { toast } from 'sonner';

interface User {
  id: string;
  displayName: string;
  phone: string;
  role: string;
  trustScore: number;
  status: 'ACTIVE' | 'BANNED' | 'SUSPENDED';
  kycStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt: string;
  totalTransactions: number;
}

const mockUsers: User[] = [
  { id: 'u1', displayName: 'Ahmed Benali', phone: '0555123456', role: 'USER', trustScore: 92, status: 'ACTIVE', kycStatus: 'VERIFIED', createdAt: '2024-01-15T10:00:00Z', totalTransactions: 47 },
  { id: 'u2', displayName: 'Fatima Zohra', phone: '0661234567', role: 'USER', trustScore: 78, status: 'ACTIVE', kycStatus: 'VERIFIED', createdAt: '2024-02-20T14:30:00Z', totalTransactions: 23 },
  { id: 'u3', displayName: 'Karim Hadj', phone: '0779876543', role: 'USER', trustScore: 45, status: 'SUSPENDED', kycStatus: 'PENDING', createdAt: '2024-03-10T09:15:00Z', totalTransactions: 3 },
  { id: 'u4', displayName: 'Nour El Houda', phone: '0550111222', role: 'ADMIN', trustScore: 100, status: 'ACTIVE', kycStatus: 'VERIFIED', createdAt: '2023-11-01T08:00:00Z', totalTransactions: 0 },
  { id: 'u5', displayName: 'Mohamed Amine', phone: '0662333444', role: 'USER', trustScore: 30, status: 'BANNED', kycStatus: 'REJECTED', createdAt: '2024-04-05T16:45:00Z', totalTransactions: 1 },
  { id: 'u6', displayName: 'Sara Khelifi', phone: '0773445566', role: 'USER', trustScore: 85, status: 'ACTIVE', kycStatus: 'VERIFIED', createdAt: '2024-01-28T11:20:00Z', totalTransactions: 31 },
  { id: 'u7', displayName: 'Yacine Messaoudi', phone: '0554556677', role: 'MODERATOR', trustScore: 95, status: 'ACTIVE', kycStatus: 'VERIFIED', createdAt: '2023-12-15T07:30:00Z', totalTransactions: 12 },
  { id: 'u8', displayName: 'Amina Boudiaf', phone: '0665667788', role: 'USER', trustScore: 62, status: 'ACTIVE', kycStatus: 'PENDING', createdAt: '2024-05-02T13:10:00Z', totalTransactions: 8 },
];

export function UserTable() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const perPage = 5;

  const filtered = mockUsers.filter((u) => {
    const matchSearch = search === '' || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.phone.includes(search) || u.id.includes(search);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const tier = getTrustTierLabel(u.trustScore);
    const matchTier = tierFilter === 'ALL' || tier === tierFilter;
    return matchSearch && matchRole && matchStatus && matchTier;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleBan = (userId: string) => {
    toast.success(t('users.ban'), { description: `User ${userId} has been banned` });
    setShowBanModal(null);
    setBanReason('');
  };

  const handleUnban = (userId: string) => {
    toast.success(t('users.unban'), { description: `User ${userId} has been unbanned` });
  };

  const handleVerifyKYC = (userId: string) => {
    toast.success(t('users.verifyKYC'), { description: `KYC verified for user ${userId}` });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      ACTIVE: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      BANNED: 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      SUSPENDED: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>
        {t(`users.${status.toLowerCase()}`)}
      </span>
    );
  };

  const tierBadge = (score: number) => {
    const tier = getTrustTierLabel(score);
    const styles: Record<string, string> = {
      ELITE: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      TRUSTED: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      ACTIVE: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      NEW: 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[tier]}`}>
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('users.searchPlaceholder')}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="ALL">{t('users.allRoles')}</option>
            <option value="USER">User</option>
            <option value="MODERATOR">Moderator</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={tierFilter}
            onChange={(e) => { setTierFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="ALL">{t('users.allTiers')}</option>
            <option value="ELITE">Elite</option>
            <option value="TRUSTED">Trusted</option>
            <option value="ACTIVE">Active</option>
            <option value="NEW">New</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="ALL">{t('users.allStatuses')}</option>
            <option value="ACTIVE">{t('users.active')}</option>
            <option value="SUSPENDED">{t('users.suspended')}</option>
            <option value="BANNED">{t('users.banned')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.role')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.trustTier')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.status')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.trustScore')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.joined')}</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('users.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginated.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xs font-bold text-primary-600">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{tierBadge(user.trustScore)}</td>
                  <td className="px-4 py-3">{statusBadge(user.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${user.trustScore >= 75 ? 'bg-success-500' : user.trustScore >= 60 ? 'bg-primary-500' : 'bg-error-500'}`}
                          style={{ width: `${user.trustScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{user.trustScore}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => router.push(`/admin/users/${user.id}`)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
                        title={t('users.viewDetails')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user.status === 'BANNED' ? (
                        <button
                          onClick={() => handleUnban(user.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors"
                          title={t('users.unban')}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => setShowBanModal(user.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors"
                          title={t('users.ban')}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {user.kycStatus === 'PENDING' && (
                        <button
                          onClick={() => handleVerifyKYC(user.id)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors"
                          title={t('users.verifyKYC')}
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * perPage + 1}-{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    p === page
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('users.ban')}</h3>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder={t('users.banReasonPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowBanModal(null); setBanReason(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('common.cancel', { defaultMessage: 'Cancel' })}
              </button>
              <button
                onClick={() => handleBan(showBanModal)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700"
              >
                {t('users.ban')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
