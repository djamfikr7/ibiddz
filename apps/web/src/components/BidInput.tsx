'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, Plus, Minus } from 'lucide-react';
import { formatDZD, cn } from '@/lib/utils';

interface BidInputProps {
  currentBid: number;
  minIncrement?: number;
  onBid: (amount: number) => Promise<{ success: boolean; error?: string }>;
  buyNowPrice?: number;
  onBuyNow?: () => void;
  disabled?: boolean;
  className?: string;
}

export function BidInput({
  currentBid,
  minIncrement = 500,
  onBid,
  buyNowPrice,
  onBuyNow,
  disabled = false,
  className,
}: BidInputProps) {
  const t = useTranslations('auctions.detail');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const minBid = currentBid + minIncrement;

  const quickIncrements = [
    { label: t('increments.small'), value: minIncrement },
    { label: t('increments.medium'), value: Math.max(minIncrement, 1000) },
    { label: t('increments.large'), value: Math.max(minIncrement, 2000) },
  ];

  const handleQuickBid = useCallback(async (increment: number) => {
    const amount = currentBid + increment;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onBid(amount);

    setIsSubmitting(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || t('bidError'));
    }
  }, [currentBid, onBid, t]);

  const handleCustomBid = useCallback(async () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount < minBid) {
      setError(t('bidTooLow').replace('{amount}', formatDZD(minBid)));
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const result = await onBid(amount);

    setIsSubmitting(false);
    if (result.success) {
      setSuccess(true);
      setCustomAmount('');
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error || t('bidError'));
    }
  }, [customAmount, minBid, onBid, t]);

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('yourBid')}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('bidIncrement')}: {formatDZD(minIncrement)}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-3">
          {quickIncrements.map((inc) => (
            <button
              key={inc.value}
              onClick={() => handleQuickBid(inc.value)}
              disabled={disabled || isSubmitting}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
              {inc.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder={formatDZD(minBid)}
              disabled={disabled || isSubmitting}
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-white disabled:opacity-50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">دج</span>
          </div>
          <button
            onClick={handleCustomBid}
            disabled={disabled || isSubmitting || !customAmount}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {t('placeBid')}
          </button>
        </div>
      </div>

      {buyNowPrice && onBuyNow && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('buyNowAvailable')}</p>
          <button
            onClick={onBuyNow}
            disabled={disabled}
            className="w-full py-3 bg-success-600 text-white rounded-lg font-medium hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('buyNow')} - {formatDZD(buyNowPrice)}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
      )}
      {success && (
        <p className="text-sm text-success-600 dark:text-success-400">{t('bidPlaced')}</p>
      )}
    </div>
  );
}
