import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    positive: boolean;
  };
  icon: LucideIcon;
  iconColor?: string;
  className?: string;
}

export function StatCard({ title, value, change, icon: Icon, iconColor = 'text-primary-600', className }: StatCardProps) {
  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
          {change && (
            <p className={cn('mt-2 text-sm font-medium', change.positive ? 'text-success-600' : 'text-error-600')}>
              {change.positive ? '+' : ''}{change.value}% from last week
            </p>
          )}
        </div>
        <div className={cn('p-3 rounded-lg bg-primary-50 dark:bg-primary-900/30', iconColor)}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
