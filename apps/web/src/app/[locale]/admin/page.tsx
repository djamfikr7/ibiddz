'use client';

import { useTranslations } from 'next-intl';
import { Users, Package, ShoppingCart, TrendingUp, Activity, Server, Database, Zap, Clock, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { formatDZD } from '@/lib/utils';

const mockActivity = [
  { id: 1, type: 'user_joined', user: 'New user 0555999888', time: '2 min ago', icon: Users },
  { id: 2, type: 'listing_created', user: 'Ahmed B. listed iPhone 14 Pro', time: '5 min ago', icon: Package },
  { id: 3, type: 'auction_ended', user: 'Auction #A123 ended - 185,000 DZD', time: '12 min ago', icon: TrendingUp },
  { id: 4, type: 'dispute_opened', user: 'Dispute #D1 opened by Fatima Z.', time: '20 min ago', icon: AlertCircle },
  { id: 5, type: 'payout_requested', user: 'Sara K. requested 242,000 DZD payout', time: '35 min ago', icon: TrendingDown },
  { id: 6, type: 'listing_approved', user: 'Listing #L45 approved by moderator', time: '1 hr ago', icon: CheckCircle },
  { id: 7, type: 'order_completed', user: 'Order #O89 completed - COD confirmed', time: '2 hr ago', icon: ShoppingCart },
  { id: 8, type: 'user_banned', user: 'User #U99 banned for fraud', time: '3 hr ago', icon: AlertCircle },
];

const revenueData = [
  { day: 'Mon', amount: 425000 },
  { day: 'Tue', amount: 380000 },
  { day: 'Wed', amount: 510000 },
  { day: 'Thu', amount: 475000 },
  { day: 'Fri', amount: 620000 },
  { day: 'Sat', amount: 550000 },
  { day: 'Sun', amount: 490000 },
];

export default function AdminOverviewPage() {
  const t = useTranslations('admin');
  const maxRevenue = Math.max(...revenueData.map((d) => d.amount));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('overview.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time platform metrics and health</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('overview.totalUsers')} value="2,847" change={{ value: 12, positive: true }} icon={Users} />
        <StatCard title={t('overview.totalListings')} value="1,234" change={{ value: 8, positive: true }} icon={Package} />
        <StatCard title={t('overview.totalOrders')} value="892" change={{ value: -3, positive: false }} icon={ShoppingCart} />
        <StatCard title={t('overview.gmvToday')} value={formatDZD(3450000)} change={{ value: 15, positive: true }} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-6">{t('overview.revenueChart')}</h3>
          <div className="flex items-end gap-3 h-48">
            {revenueData.map((d) => (
              <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{formatDZD(d.amount).replace(' دج', '')}</span>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-lg relative" style={{ height: `${(d.amount / maxRevenue) * 100}%` }}>
                  <div className="absolute inset-0 bg-primary-500 rounded-t-lg opacity-80" />
                </div>
                <span className="text-xs text-gray-500">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('overview.systemHealth')}</h3>
          <div className="space-y-4">
            {[
              { label: t('overview.apiStatus'), status: 'healthy', icon: Server },
              { label: t('overview.dbStatus'), status: 'healthy', icon: Database },
              { label: t('overview.cacheStatus'), status: 'healthy', icon: Zap },
              { label: t('overview.queueStatus'), status: 'degraded', icon: Clock },
            ].map((item) => {
              const Icon = item.icon;
              const isHealthy = item.status === 'healthy';
              return (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    isHealthy ? 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400' : 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400'
                  }`}>
                    {isHealthy ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {t(`overview.${item.status}`)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('overview.recentActivity')}</h3>
            <span className="text-xs text-gray-500">{mockActivity.length} events</span>
          </div>
          <div className="space-y-3">
            {mockActivity.slice(0, 6).map((activity) => {
              const Icon = activity.icon;
              return (
                <div key={activity.id} className="flex items-start gap-3 py-2">
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{activity.user}</p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{t('overview.pendingModeration')}</h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400">
              5 pending
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">5</p>
              <p className="text-xs text-gray-500 mt-1">Listings</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">2</p>
              <p className="text-xs text-gray-500 mt-1">KYC Reviews</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-xs text-gray-500 mt-1">Disputes</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">3</p>
              <p className="text-xs text-gray-500 mt-1">Payouts</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
