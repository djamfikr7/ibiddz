'use client';

import { cn, getTrustTier } from '@/lib/utils';
import { Shield, ShieldCheck, ShieldAlert, Crown } from 'lucide-react';

interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  className?: string;
}

export function TrustBadge({ score, size = 'md', showScore = true, className }: TrustBadgeProps) {
  const tier = getTrustTier(score);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const getIcon = () => {
    if (score >= 88) return <Crown className={cn(iconSizes[size], 'text-yellow-500')} />;
    if (score >= 75) return <ShieldCheck className={cn(iconSizes[size], 'text-success-500')} />;
    if (score >= 60) return <Shield className={cn(iconSizes[size], 'text-primary-500')} />;
    return <ShieldAlert className={cn(iconSizes[size], 'text-gray-400')} />;
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium', tier.bgColor, sizeClasses[size], className)}>
      {getIcon()}
      <span className={tier.color}>{tier.label}</span>
      {showScore && (
        <span className="text-gray-500 dark:text-gray-400 tabular-nums">{score}</span>
      )}
    </div>
  );
}
