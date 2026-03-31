'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuctionTimerProps {
  endTime: string;
  antiSnipingActive?: boolean;
  antiSnipingSeconds?: number;
  className?: string;
}

export function AuctionTimer({ endTime, antiSnipingActive = false, antiSnipingSeconds = 30, className }: AuctionTimerProps) {
  const t = useTranslations('auctions.detail');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isAntiSniping, setIsAntiSniping] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const remaining = Math.max(0, end - now);
    setTimeLeft(remaining);
    setIsUrgent(remaining > 0 && remaining <= 60000);
    setIsAntiSniping(antiSnipingActive && remaining > 0 && remaining <= antiSnipingSeconds * 1000);
    return remaining;
  }, [endTime, antiSnipingActive, antiSnipingSeconds]);

  useEffect(() => {
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [calculateTimeLeft]);

  const formatTime = (ms: number) => {
    if (ms <= 0) return { hours: '00', minutes: '00', seconds: '00' };
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const time = formatTime(timeLeft);
  const isEnded = timeLeft <= 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">{t('timeLeft')}</span>
        {isAntiSniping && (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 text-xs font-medium rounded-full animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {t('antiSniping')}
          </span>
        )}
      </div>

      <div className={cn(
        'flex items-center gap-1 font-mono text-3xl font-bold',
        isEnded ? 'text-gray-400 dark:text-gray-500' :
        isUrgent ? 'text-error-600 dark:text-error-400' :
        'text-gray-900 dark:text-white'
      )}>
        <span className={cn('px-3 py-2 rounded-lg', isUrgent ? 'bg-error-50 dark:bg-error-900/20' : 'bg-gray-100 dark:bg-gray-800')}>
          {time.hours}
        </span>
        <span>:</span>
        <span className={cn('px-3 py-2 rounded-lg', isUrgent ? 'bg-error-50 dark:bg-error-900/20' : 'bg-gray-100 dark:bg-gray-800')}>
          {time.minutes}
        </span>
        <span>:</span>
        <span className={cn('px-3 py-2 rounded-lg', isUrgent ? 'bg-error-50 dark:bg-error-900/20' : 'bg-gray-100 dark:bg-gray-800')}>
          {time.seconds}
        </span>
      </div>

      {isAntiSniping && (
        <p className="text-xs text-warning-600 dark:text-warning-400">
          {t('antiSnipingDesc')}
        </p>
      )}

      {isEnded && (
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {t('auctionEnded')}
        </p>
      )}
    </div>
  );
}
