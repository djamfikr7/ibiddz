'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Gavel, Clock, Users, ArrowRight } from 'lucide-react';
import { ListingCard } from '@/components/ListingCard';
import { cn } from '@/lib/utils';

const liveAuctions = [
  {
    id: 'a1',
    title: 'iPhone 15 Pro 256GB Natural Titanium',
    model: 'iPhone 15 Pro',
    storageGB: 256,
    condition: 'LIKE_NEW',
    batteryHealth: 96,
    currentBid: 162000,
    startingPrice: 150000,
    buyNowPrice: 190000,
    bidCount: 24,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Blida',
    sellerTrustScore: 95,
    sellerName: 'Yacine T.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-15T18:00:00Z',
  },
  {
    id: 'a2',
    title: 'iPhone 14 128GB Starlight',
    model: 'iPhone 14',
    storageGB: 128,
    condition: 'EXCELLENT',
    batteryHealth: 89,
    currentBid: 95000,
    startingPrice: 85000,
    buyNowPrice: 115000,
    bidCount: 15,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Setif',
    sellerTrustScore: 72,
    sellerName: 'Amina R.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-15T17:00:00Z',
  },
  {
    id: 'a3',
    title: 'iPhone 13 Pro Max 256GB Sierra Blue',
    model: 'iPhone 13 Pro Max',
    storageGB: 256,
    condition: 'GOOD',
    batteryHealth: 84,
    currentBid: 112000,
    startingPrice: 100000,
    buyNowPrice: 135000,
    bidCount: 19,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Oran',
    sellerTrustScore: 81,
    sellerName: 'Mohamed D.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-15T16:00:00Z',
  },
];

const upcomingAuctions = [
  {
    id: 'u1',
    title: 'iPhone 15 Pro Max 512GB Blue Titanium',
    model: 'iPhone 15 Pro Max',
    storageGB: 512,
    condition: 'NEW',
    batteryHealth: 100,
    startingPrice: 220000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Algiers',
    sellerTrustScore: 97,
    sellerName: 'Certified Store',
    featured: true,
    isAuction: true,
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: 'u2',
    title: 'iPhone 12 128GB Black',
    model: 'iPhone 12',
    storageGB: 128,
    condition: 'FAIR',
    batteryHealth: 78,
    startingPrice: 55000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Constantine',
    sellerTrustScore: 63,
    sellerName: 'Rachid B.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-16T12:00:00Z',
  },
];

export default function AuctionsPage() {
  const t = useTranslations('auctions');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Gavel className="w-8 h-8 text-primary-600" />
          {t('title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-error-500"></span>
          </span>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('live')}</h2>
          <span className="px-2 py-0.5 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-xs font-medium rounded-full">
            {liveAuctions.length}
          </span>
        </div>

        {liveAuctions.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Gavel className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noLiveAuctions')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{t('checkBack')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveAuctions.map((auction) => (
              <Link key={auction.id} href={`/auctions/${auction.id}`}>
                <ListingCard {...auction} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-6">
          <Clock className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('upcoming')}</h2>
          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
            {upcomingAuctions.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAuctions.map((auction) => (
            <Link key={auction.id} href={`/auctions/${auction.id}`}>
              <div className="group block bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                  <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                    <Clock className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="px-4 py-2 bg-white/90 dark:bg-gray-800/90 rounded-lg text-sm font-medium text-gray-900 dark:text-white">
                      Starting in 2h 30m
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 mb-2">{auction.title}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      From {auction.startingPrice.toLocaleString()} دج
                    </p>
                    <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                      <Users className="w-4 h-4" />
                      {auction.sellerTrustScore}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
