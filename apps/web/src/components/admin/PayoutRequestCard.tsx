'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, CreditCard, Building, Wallet } from 'lucide-react';
import { formatDZD } from '@/lib/utils';
import { toast } from 'sonner';

interface PayoutRequest {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  commission: number;
  netAmount: number;
  method: 'CCP' | 'EDAHABIA' | 'BANK';
  accountDetails: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  createdAt: string;
}

const mockPayouts: PayoutRequest[] = [
  { id: 'p1', userId: 'u1', userName: 'Ahmed Benali', amount: 185000, commission: 6050, netAmount: 178950, method: 'CCP', accountDetails: '00123456789 01', status: 'PENDING', createdAt: '2024-06-01T10:00:00Z' },
  { id: 'p2', userId: 'u2', userName: 'Fatima Zohra', amount: 95000, commission: 3350, netAmount: 91650, method: 'EDAHABIA', accountDetails: 'Card ending 4567', status: 'PENDING', createdAt: '2024-06-01T09:00:00Z' },
  { id: 'p3', userId: 'u6', userName: 'Sara Khelifi', amount: 250000, commission: 8000, netAmount: 242000, method: 'BANK', accountDetails: 'DZ42 00123 4567890123456789 01', status: 'PENDING', createdAt: '2024-05-31T16:00:00Z' },
  { id: 'p4', userId: 'u8', userName: 'Amina Boudiaf', amount: 42000, commission: 1760, netAmount: 40240, method: 'CCP', accountDetails: '00987654321 02', status: 'APPROVED', createdAt: '2024-05-30T14:00:00Z' },
];

const methodIcons: Record<string, typeof CreditCard> = {
  CCP: Wallet,
  EDAHABIA: CreditCard,
  BANK: Building,
};

export function PayoutRequestCard() {
  const t = useTranslations('admin');
  const pending = mockPayouts.filter((p) => p.status === 'PENDING');

  const handleApprove = (id: string) => {
    toast.success(t('finance.approve'), { description: `Payout ${id} approved` });
  };

  const handleReject = (id: string) => {
    toast.error(t('finance.reject'), { description: `Payout ${id} rejected` });
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      APPROVED: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      REJECTED: 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      COMPLETED: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {t(`finance.${status.toLowerCase()}`)}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('finance.withdrawalRequests')}</h3>
        <span className="text-sm text-gray-500">{pending.length} pending</span>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('finance.noWithdrawals')}</div>
      ) : (
        <div className="grid gap-4">
          {pending.map((payout) => {
            const MethodIcon = methodIcons[payout.method];
            return (
              <div key={payout.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30">
                        <MethodIcon className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{payout.userName}</h4>
                        <p className="text-xs text-gray-500">{t(`finance.${payout.method.toLowerCase()}`)} · {payout.accountDetails}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">{t('finance.amount')}</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDZD(payout.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('finance.commission')}</p>
                        <p className="text-sm text-error-600">-{formatDZD(payout.commission)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{t('finance.netAmount')}</p>
                        <p className="text-sm font-bold text-success-600">{formatDZD(payout.netAmount)}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{new Date(payout.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {statusBadge(payout.status)}
                    {payout.status === 'PENDING' && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleApprove(payout.id)}
                          className="p-2 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors"
                          title={t('finance.approve')}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(payout.id)}
                          className="p-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors"
                          title={t('finance.reject')}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('finance.pendingPayouts')}</h3>
        <div className="space-y-2">
          {mockPayouts.filter((p) => p.status !== 'PENDING').map((payout) => (
            <div key={payout.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{payout.userName}</p>
                <p className="text-xs text-gray-500">{t(`finance.${payout.method.toLowerCase()}`)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDZD(payout.netAmount)}</p>
                {statusBadge(payout.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
