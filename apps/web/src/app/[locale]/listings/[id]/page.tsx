'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, Battery, MapPin, Eye, Heart, Share2, Flag, Shield, Package, Calendar, Smartphone, HardDrive, Palette, Wrench, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { PhotoCarousel } from '@/components/PhotoCarousel';
import { TrustBadge } from '@/components/TrustBadge';
import { BidInput } from '@/components/BidInput';
import { formatDZD, formatDate, timeAgo, getConditionColor, calculateCommission, calculateNetPayout, cn } from '@/lib/utils';

const mockListing = {
  id: '1',
  title: 'iPhone 15 Pro Max 256GB Natural Titanium',
  description: 'Selling my iPhone 15 Pro Max in excellent condition. Always used with a case and screen protector. Battery health is at 98%. Comes with original box, cable, and documentation. No scratches or dents. AppleCare+ valid until March 2025.',
  model: 'iPhone 15 Pro Max',
  storageGB: 256,
  color: 'Natural Titanium',
  condition: 'LIKE_NEW',
  batteryHealth: 98,
  imeiHash: 'a1b2c3d4e5f6',
  accessories: ['Original Box', 'USB-C Cable', 'Documentation', 'AppleCare+'],
  originalBox: true,
  warrantyRemaining: 6,
  startingPrice: 175000,
  buyNowPrice: 210000,
  currentBid: 185000,
  bidCount: 12,
  photos: [
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
    '/placeholder-phone.jpg',
  ],
  coverPhoto: '/placeholder-phone.jpg',
  wilaya: 'Algiers',
  city: 'Hydra',
  viewCount: 234,
  favoriteCount: 18,
  featured: true,
  isAuction: true,
  auctionEnd: '2024-01-16T20:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  seller: {
    id: 's1',
    displayName: 'Ahmed K.',
    trustScore: 92,
    memberSince: '2023-06-15',
    listingsCount: 8,
  },
};

export default function ListingDetailPage() {
  const t = useTranslations('listings.detail');
  const params = useParams();
  const listing = mockListing;

  const handleBid = async (amount: number) => {
    return { success: true };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/listings"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backToListings')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <PhotoCarousel photos={listing.photos} alt={listing.title} />

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{listing.title}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn('px-2.5 py-1 text-sm font-medium rounded-lg', getConditionColor(listing.condition))}>
                    {listing.condition.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                    <Battery className="w-4 h-4" />
                    {listing.batteryHealth}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Heart className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Share2 className="w-5 h-5 text-gray-500" />
                </button>
                <button className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Flag className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Smartphone className="w-4 h-4" />
                <span>{listing.model}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <HardDrive className="w-4 h-4" />
                <span>{listing.storageGB}GB</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Palette className="w-4 h-4" />
                <span>{listing.color}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{listing.wilaya}</span>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('description')}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{listing.description}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('details')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: Smartphone, label: t('model'), value: listing.model },
                { icon: HardDrive, label: t('storage'), value: `${listing.storageGB}GB` },
                { icon: Palette, label: t('color'), value: listing.color },
                { icon: Wrench, label: t('condition'), value: listing.condition.replace('_', ' ') },
                { icon: Battery, label: t('batteryHealth'), value: `${listing.batteryHealth}%` },
                { icon: Package, label: t('originalBox'), value: listing.originalBox ? t('yes') : t('no') },
                { icon: Calendar, label: t('warranty'), value: listing.warrantyRemaining > 0 ? `${listing.warrantyRemaining} ${t('months')}` : t('no') },
                { icon: Shield, label: t('imeiVerified'), value: t('yes') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <item.icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {listing.accessories.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">{t('accessories')}</h4>
                <div className="flex flex-wrap gap-2">
                  {listing.accessories.map((acc, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-sm rounded-lg">
                      <CheckCircle className="w-4 h-4" />
                      {acc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 sticky top-20">
            {listing.isAuction ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('currentBid')}</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {formatDZD(listing.currentBid || listing.startingPrice)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{listing.bidCount} bids</p>
                </div>

                {listing.buyNowPrice && (
                  <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                    <p className="text-sm text-success-700 dark:text-success-400">{t('buyNowPrice')}</p>
                    <p className="text-xl font-bold text-success-600 dark:text-success-400">
                      {formatDZD(listing.buyNowPrice)}
                    </p>
                  </div>
                )}

                <BidInput
                  currentBid={listing.currentBid || listing.startingPrice}
                  buyNowPrice={listing.buyNowPrice}
                  onBid={handleBid}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('buyNowPrice')}</p>
                  <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                    {formatDZD(listing.startingPrice)}
                  </p>
                </div>
                <button className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors">
                  {t('buyNow')}
                </button>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                    {listing.seller.displayName?.[0] || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{listing.seller.displayName}</p>
                  <TrustBadge score={listing.seller.trustScore} size="sm" />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-between">
                <span>{t('listedOn')}</span>
                <span>{formatDate(listing.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('views')}</span>
                <span>{listing.viewCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('favorites')}</span>
                <span>{listing.favoriteCount}</span>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Estimated commission: {formatDZD(calculateCommission(listing.currentBid || listing.startingPrice))}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Seller net payout: {formatDZD(calculateNetPayout(listing.currentBid || listing.startingPrice))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
