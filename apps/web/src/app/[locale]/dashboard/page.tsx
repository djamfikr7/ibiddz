'use client';

import { useTranslations } from 'next-intl';
import { Wallet, TrendingUp, Package, Gavel, Star, ArrowUpRight, ArrowDownRight, Plus, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { TrustBadge } from '@/components/TrustBadge';
import { ListingCard } from '@/components/ListingCard';
import { formatDZD, cn } from '@/lib/utils';

const mockUser = {
  id: 'u1',
  displayName: 'Ahmed K.',
  phone: '0555123456',
  trustScore: 82,
  walletDZD: 45000,
  pendingDZD: 12000,
  memberSince: '2023-06-15',
  totalListings: 12,
  totalSales: 8,
  totalPurchases: 5,
  avgRating: 4.7,
  completionRate: 96,
};

const mockListings = [
  {
    id: '1',
    title: 'iPhone 14 Pro 128GB Deep Purple',
    model: 'iPhone 14 Pro',
    storageGB: 128,
    condition: 'EXCELLENT',
    batteryHealth: 91,
    startingPrice: 145000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Algiers',
    sellerTrustScore: 82,
    sellerName: 'Ahmed K.',
    featured: false,
    isAuction: false,
    createdAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '2',
    title: 'iPhone 13 128GB Midnight',
    model: 'iPhone 13',
    storageGB: 128,
    condition: 'GOOD',
    batteryHealth: 85,
    startingPrice: 85000,
    bidCount: 3,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Algiers',
    sellerTrustScore: 82,
    sellerName: 'Ahmed K.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-13T09:00:00Z',
  },
];

const mockTransactions = [
  { id: 't1', type: 'sale', amount: 145000, description: 'iPhone 14 Pro sold', date: '2024-01-14', status: 'completed' },
  { id: 't2', type: 'withdrawal', amount: -100000, description: 'Withdrawal to CCP', date: '2024-01-12', status: 'completed' },
  { id: 't3', type: 'sale', amount: 95000, description: 'iPhone 12 sold', date: '2024-01-10', status: 'completed' },
  { id: 't4', type: 'commission', amount: -4350, description: 'Platform commission', date: '2024-01-14', status: 'completed' },
  { id: 't5', type: 'pending', amount: 12000, description: 'iPhone 13 auction pending', date: '2024-01-15', status: 'pending' },
];

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const user = mockUser;

  const stats = [
    { label: t('stats.totalListings'), value: user.totalListings, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('stats.totalSales'), value: user.totalSales, icon: TrendingUp, color: 'text-success-600', bg: 'bg-success-50 dark:bg-success-900/20' },
    { label: t('stats.totalPurchases'), value: user.totalPurchases, icon: Gavel, color: 'text-warning-600', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { label: t('stats.avgRating'), value: user.avgRating, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{t('welcome')}, {user.displayName}</p>
        </div>
        <Link
          href="/listings/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t('listings.createNew')}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', stat.bg)}>
                <stat.icon className={cn('w-5 h-5', stat.color)} />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                {user.displayName?.[0] || 'U'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{user.displayName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.phone}</p>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('trustScore')}</p>
            <TrustBadge score={user.trustScore} size="lg" />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>{t('stats.completionRate')}</span>
            <span className="font-medium text-success-600">{user.completionRate}%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary-600" />
              {t('wallet.title')}
            </h2>
            <button className="flex items-center gap-1 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors">
              <CreditCard className="w-4 h-4" />
              {t('wallet.withdraw')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <p className="text-sm text-success-600 dark:text-success-400">{t('wallet.balance')}</p>
              <p className="text-2xl font-bold text-success-700 dark:text-success-300 mt-1">
                {formatDZD(user.walletDZD)}
              </p>
            </div>
            <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
              <p className="text-sm text-warning-600 dark:text-warning-400">{t('wallet.pending')}</p>
              <p className="text-2xl font-bold text-warning-700 dark:text-warning-300 mt-1">
                {formatDZD(user.pendingDZD)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('wallet.transactions')}</h3>
            {mockTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center',
                    tx.amount > 0 ? 'bg-success-100 dark:bg-success-900/30' : 'bg-gray-100 dark:bg-gray-700'
                  )}>
                    {tx.amount > 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-success-600" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.description}</p>
                    <p className="text-xs text-gray-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    tx.amount > 0 ? 'text-success-600' : 'text-gray-600 dark:text-gray-400'
                  )}>
                    {tx.amount > 0 ? '+' : ''}{formatDZD(Math.abs(tx.amount))}
                  </p>
                  {tx.status === 'pending' ? (
                    <span className="text-xs text-warning-600 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3" />
                      Pending
                    </span>
                  ) : (
                    <span className="text-xs text-success-600 flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3 h-3" />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-primary-600" />
              {t('listings.title')}
            </h2>
            <Link href="/listings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {mockListings.map((listing) => (
              <Link key={listing.id} href={`/listings/${listing.id}`} className="block">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{listing.condition} · {listing.batteryHealth}% battery</p>
                    <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                      {formatDZD(listing.startingPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    {listing.bidCount > 0 ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-medium rounded-full">
                        <Gavel className="w-3 h-3" />
                        {listing.bidCount} bids
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('orders.title')}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Order</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Item</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Type</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Amount</th>
                <th className="text-left py-3 px-4 text-gray-500 dark:text-gray-400 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'ORD-001', item: 'iPhone 14 Pro', type: 'Selling', amount: 145000, status: 'Delivered' },
                { id: 'ORD-002', item: 'iPhone 12', type: 'Buying', amount: 75000, status: 'Shipped' },
                { id: 'ORD-003', item: 'iPhone 13', type: 'Selling', amount: 85000, status: 'Pending' },
              ].map((order) => (
                <tr key={order.id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  <td className="py-3 px-4 font-mono text-gray-900 dark:text-white">{order.id}</td>
                  <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{order.item}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full',
                      order.type === 'Selling'
                        ? 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400'
                        : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    )}>
                      {order.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{formatDZD(order.amount)}</td>
                  <td className="py-3 px-4">
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
                      order.status === 'Delivered' ? 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400' :
                      order.status === 'Shipped' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                      'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400'
                    )}>
                      {order.status === 'Delivered' ? <CheckCircle className="w-3 h-3" /> :
                       order.status === 'Shipped' ? <Clock className="w-3 h-3" /> :
                       <Clock className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
