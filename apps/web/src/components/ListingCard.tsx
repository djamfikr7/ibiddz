'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Battery, MapPin, Gavel, Heart, Star } from 'lucide-react';
import { TrustBadge } from './TrustBadge';
import { formatDZD, timeAgo, getConditionColor, cn } from '@/lib/utils';

interface ListingCardProps {
  id: string;
  title: string;
  model: string;
  storageGB: number;
  condition: string;
  batteryHealth: number;
  currentBid?: number;
  buyNowPrice?: number;
  startingPrice: number;
  bidCount?: number;
  photos: string[];
  coverPhoto: string;
  wilaya: string;
  sellerTrustScore: number;
  sellerName?: string;
  featured?: boolean;
  isAuction?: boolean;
  createdAt: string;
  locale?: string;
}

export function ListingCard({
  id,
  title,
  model,
  storageGB,
  condition,
  batteryHealth,
  currentBid,
  buyNowPrice,
  startingPrice,
  bidCount = 0,
  photos,
  coverPhoto,
  wilaya,
  sellerTrustScore,
  sellerName,
  featured = false,
  isAuction = false,
  createdAt,
  locale = 'en',
}: ListingCardProps) {
  const t = useTranslations('listings.card');
  const displayPrice = currentBid || startingPrice;

  return (
    <Link href={`/listings/${id}`} className="group block">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={coverPhoto || '/placeholder-phone.jpg'}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {featured && (
            <div className="absolute top-2 left-2 px-2 py-1 bg-warning-500 text-white text-xs font-semibold rounded-md">
              {t('featured')}
            </div>
          )}
          {isAuction && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-error-500 text-white text-xs font-semibold rounded-md flex items-center gap-1">
              <Gavel className="w-3 h-3" />
              {t('bids')}
            </div>
          )}
          <button
            onClick={(e) => e.preventDefault()}
            className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Heart className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-600 transition-colors">
              {title}
            </h3>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className={cn('px-2 py-0.5 text-xs font-medium rounded-md', getConditionColor(condition))}>
              {t(condition.toLowerCase().replace('_', '') as any) || condition}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Battery className="w-3 h-3" />
              {batteryHealth}%
            </span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-lg font-bold text-primary-600 dark:text-primary-400">
                {formatDZD(displayPrice)}
              </p>
              {buyNowPrice && buyNowPrice > displayPrice && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('buyNow')}: {formatDZD(buyNowPrice)}
                </p>
              )}
            </div>
            {isAuction && bidCount > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {bidCount} {t('bids')}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{wilaya}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrustBadge score={sellerTrustScore} size="sm" />
              <span className="text-xs text-gray-400">{timeAgo(createdAt, locale)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
