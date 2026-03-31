'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users, Gavel, Eye, Share2, Heart, Shield, Clock } from 'lucide-react';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { TrustBadge } from '@/components/TrustBadge';
import { AuctionTimer } from '@/components/AuctionTimer';
import { BidInput } from '@/components/BidInput';
import { formatDZD, cn } from '@/lib/utils';

const mockAuction = {
  id: 'a1',
  title: 'iPhone 15 Pro 256GB Natural Titanium',
  description: 'Barely used iPhone 15 Pro in pristine condition. Purchased 2 months ago, always with case and screen protector. Selling because I upgraded to the Pro Max.',
  model: 'iPhone 15 Pro',
  storageGB: 256,
  color: 'Natural Titanium',
  condition: 'LIKE_NEW',
  batteryHealth: 96,
  startingPrice: 150000,
  currentBid: 162000,
  buyNowPrice: 190000,
  bidCount: 24,
  bidderCount: 8,
  viewCount: 456,
  photos: [
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
  ],
  coverPhoto: '/placeholder-phone.jpg',
  wilaya: 'Blida',
  endTime: new Date(Date.now() + 2 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
  status: 'LIVE' as const,
  hasBuyNow: true,
  antiSniping: true,
  antiSnipingSeconds: 30,
  seller: {
    id: 's1',
    displayName: 'Yacine T.',
    trustScore: 95,
    memberSince: '2023-03-10',
  },
};

const bidHistory = [
  { id: 'b1', amount: 162000, time: '2 min ago', bidder: 'User***45', isWinning: true },
  { id: 'b2', amount: 161000, time: '5 min ago', bidder: 'User***12' },
  { id: 'b3', amount: 160000, time: '8 min ago', bidder: 'User***89' },
  { id: 'b4', amount: 158000, time: '12 min ago', bidder: 'User***34' },
  { id: 'b5', amount: 156000, time: '18 min ago', bidder: 'User***67' },
  { id: 'b6', amount: 155000, time: '25 min ago', bidder: 'User***23' },
  { id: 'b7', amount: 153000, time: '35 min ago', bidder: 'User***78' },
  { id: 'b8', amount: 150000, time: '42 min ago', bidder: 'User***45' },
];

export default function AuctionDetailPage() {
  const t = useTranslations('auctions.detail');
  const params = useParams();
  const auction = mockAuction;

  const handleBid = async (amount: number) => {
    return { success: true };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/auctions"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToAuctions')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex items-center gap-2 px-3 py-1.5 bg-error-100 dark:bg-error-900/30 text-error-600 dark:text-error-400 text-sm font-semibold rounded-full animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error-500"></span>
              </span>
              {t('liveBadge')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{auction.model}</span>
          </div>

          <PhotoCarousel photos={auction.photos} alt={auction.title} />

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{auction.title}</h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{auction.description}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('bidHistory')}</h3>
            <div className="space-y-3">
              {bidHistory.map((bid, i) => (
                <div
                  key={bid.id}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    i === 0 ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800' : 'bg-gray-50 dark:bg-gray-700/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold',
                      i === 0 ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    )}>
                      {bid.bidder.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{bid.bidder}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{bid.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('font-semibold', i === 0 ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white')}>
                      {formatDZD(bid.amount)}
                    </p>
                    {bid.isWinning && (
                      <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">Winning</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            <AuctionTimer
              endTime={auction.endTime}
              antiSnipingActive={auction.antiSniping}
              antiSnipingSeconds={auction.antiSnipingSeconds}
            />

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('currentBid')}</span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Gavel className="w-3 h-3" />
                  {auction.bidCount} {t('totalBids').toLowerCase()}
                </span>
              </div>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {formatDZD(auction.currentBid)}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('startingPrice')}</span>
                <span className="text-gray-900 dark:text-white">{formatDZD(auction.startingPrice)}</span>
              </div>
            </div>

            <div className="mt-6">
              <BidInput
                currentBid={auction.currentBid}
                buyNowPrice={auction.hasBuyNow ? auction.buyNowPrice : undefined}
                onBid={handleBid}
              />
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {auction.seller.displayName?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{auction.seller.displayName}</p>
                  <TrustBadge score={auction.seller.trustScore} size="sm" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 grid grid-cols-3 gap-4 text-center">
              <div>
                <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{auction.bidderCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('bidders')}</p>
              </div>
              <div>
                <Gavel className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{auction.bidCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('totalBids')}</p>
              </div>
              <div>
                <Eye className="w-5 h-5 mx-auto text-gray-400 mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{auction.viewCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Views</p>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Heart className="w-4 h-4" />
                {t('watchAuction')}
              </button>
              <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
