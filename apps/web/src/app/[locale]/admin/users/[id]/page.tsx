'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Shield, FileText, AlertTriangle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getTrustTierLabel, formatDZD } from '@/lib/utils';
import { useState } from 'react';
import { toast } from 'sonner';

const mockUserDetail = {
  id: 'u1',
  displayName: 'Ahmed Benali',
  phone: '0555123456',
  email: 'ahmed.b@email.com',
  location: 'Algiers, Algeria',
  role: 'USER',
  trustScore: 92,
  status: 'ACTIVE',
  kycStatus: 'VERIFIED',
  createdAt: '2024-01-15T10:00:00Z',
  lastActive: '2024-06-01T09:30:00Z',
  totalTransactions: 47,
  completedDeals: 44,
  disputeRate: '2.1%',
  avgResponseTime: '15 min',
  trustBreakdown: [
    { label: 'Transaction History', score: 25, max: 25 },
    { label: 'KYC Verification', score: 20, max: 20 },
    { label: 'Response Rate', score: 18, max: 20 },
    { label: 'Dispute Rate', score: 15, max: 15 },
    { label: 'Account Age', score: 14, max: 20 },
  ],
  kycDocuments: [
    { type: 'National ID', status: 'Verified', date: '2024-01-16' },
    { type: 'Proof of Address', status: 'Verified', date: '2024-01-16' },
  ],
  transactions: [
    { id: 't1', type: 'Sale', amount: 185000, date: '2024-06-01', status: 'Completed' },
    { id: 't2', type: 'Purchase', amount: 95000, date: '2024-05-28', status: 'Completed' },
    { id: 't3', type: 'Sale', amount: 120000, date: '2024-05-20', status: 'Completed' },
    { id: 't4', type: 'Payout', amount: 178950, date: '2024-05-25', status: 'Completed' },
  ],
  listings: [
    { id: 'l1', title: 'iPhone 14 Pro Max 256GB', price: 185000, status: 'Sold', date: '2024-06-01' },
    { id: 'l2', title: 'iPhone 13 128GB', price: 95000, status: 'Active', date: '2024-05-30' },
    { id: 'l3', title: 'iPhone 12 Pro 128GB', price: 75000, status: 'Expired', date: '2024-05-15' },
  ],
  banHistory: [],
  appealStatus: 'none',
};

export default function AdminUserDetailPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'profile' | 'kyc' | 'trust' | 'transactions' | 'listings' | 'bans' | 'appeal'>('profile');
  const [scoreAdjustment, setScoreAdjustment] = useState('');

  const handleAdjustScore = () => {
    toast.success(t('users.adjustScore'), { description: `Score adjusted by ${scoreAdjustment}` });
    setScoreAdjustment('');
  };

  const tabs = [
    { key: 'profile', label: t('users.detail.profile') },
    { key: 'kyc', label: t('users.detail.kycDocuments') },
    { key: 'trust', label: t('users.detail.trustScoreBreakdown') },
    { key: 'transactions', label: t('users.detail.transactionHistory') },
    { key: 'listings', label: t('users.detail.listingHistory') },
    { key: 'bans', label: t('users.detail.banHistory') },
    { key: 'appeal', label: t('users.detail.appealStatus') },
  ];

  const user = mockUserDetail;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('users.detail.title')}</h1>
          <p className="text-sm text-gray-500">{user.displayName} · {user.phone}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-xl font-bold text-primary-600">
            {user.displayName.charAt(0)}
          </div>
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('users.detail.phone')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('users.detail.email')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('users.detail.location')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{user.location}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('users.trustScore')}</p>
                <p className="text-sm font-bold text-success-600">{user.trustScore} ({getTrustTierLabel(user.trustScore)})</p>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">{t('users.detail.memberSince')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">{t('users.detail.lastActive')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{new Date(user.lastActive).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">{t('users.detail.totalTransactions')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{user.totalTransactions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-gray-400" />
            <div>
              <p className="text-xs text-gray-500">{t('users.detail.disputeRate')}</p>
              <p className="text-sm text-gray-900 dark:text-white">{user.disputeRate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('users.detail.profile')}</h4>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Role</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.role}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-medium text-success-600">{user.status}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">KYC</span>
                  <span className="text-sm font-medium text-success-600">{user.kycStatus}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-50 dark:border-gray-800">
                  <span className="text-sm text-gray-500">{t('users.detail.completedDeals')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.completedDeals}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-500">{t('users.detail.avgResponseTime')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{user.avgResponseTime}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('users.adjustScore')}</h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t('users.scoreAdjustmentPlaceholder')}
                  value={scoreAdjustment}
                  onChange={(e) => setScoreAdjustment(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
                <button
                  onClick={handleAdjustScore}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
                >
                  {t('users.adjustScore')}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'kyc' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.kycDocuments')}</h4>
            <div className="space-y-3">
              {user.kycDocuments.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.type}</p>
                      <p className="text-xs text-gray-500">{doc.date}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400">
                    {doc.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'trust' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.trustScoreBreakdown')}</h4>
            <div className="space-y-4">
              {user.trustBreakdown.map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.score}/{item.max}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${(item.score / item.max) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.transactionHistory')}</h4>
            <div className="space-y-2">
              {user.transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.type}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDZD(tx.amount)}</p>
                    <span className="text-xs text-success-600">{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'listings' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.listingHistory')}</h4>
            <div className="space-y-2">
              {user.listings.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDZD(listing.price)}</p>
                    <span className="text-xs text-gray-500">{listing.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bans' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.banHistory')}</h4>
            {user.banHistory.length === 0 ? (
              <p className="text-sm text-gray-500">No ban history</p>
            ) : (
              <div className="space-y-2">
                {user.banHistory.map((ban: any, i: number) => (
                  <div key={i} className="p-4 rounded-lg bg-error-50 dark:bg-error-900/20">
                    <p className="text-sm font-medium text-error-700 dark:text-error-400">{ban.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">{ban.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'appeal' && (
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('users.detail.appealStatus')}</h4>
            {user.appealStatus === 'none' ? (
              <p className="text-sm text-gray-500">{t('users.detail.noAppeal')}</p>
            ) : (
              <div className="p-4 rounded-lg bg-warning-50 dark:bg-warning-900/20">
                <p className="text-sm font-medium text-warning-700 dark:text-warning-400">{t('users.detail.appealPending')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
