'use client';

import { useTranslations } from 'next-intl';
import { TrendingUp, DollarSign, Calendar, Download } from 'lucide-react';
import { StatCard } from '@/components/admin/StatCard';
import { PayoutRequestCard } from '@/components/admin/PayoutRequestCard';
import { formatDZD } from '@/lib/utils';
import { toast } from 'sonner';

const commissionLedger = [
  { id: 'c1', listing: 'iPhone 14 Pro Max', seller: 'Ahmed B.', amount: 185000, commission: 6050, net: 178950, date: '2024-06-01' },
  { id: 'c2', listing: 'iPhone 13 128GB', seller: 'Fatima Z.', amount: 95000, commission: 3350, net: 91650, date: '2024-05-30' },
  { id: 'c3', listing: 'iPhone 12 64GB', seller: 'Amina B.', amount: 55000, commission: 2150, net: 52850, date: '2024-05-28' },
  { id: 'c4', listing: 'iPhone 15 Pro 512GB', seller: 'Sara K.', amount: 250000, commission: 8000, net: 242000, date: '2024-05-25' },
];

const dailySettlement = [
  { date: '2024-06-01', gmv: 3450000, commission: 115000, payouts: 2800000, net: 535000 },
  { date: '2024-05-31', gmv: 2890000, commission: 96000, payouts: 2300000, net: 494000 },
  { date: '2024-05-30', gmv: 3120000, commission: 104000, payouts: 2500000, net: 516000 },
  { date: '2024-05-29', gmv: 2750000, commission: 92000, payouts: 2200000, net: 458000 },
  { date: '2024-05-28', gmv: 3680000, commission: 122000, payouts: 2900000, net: 658000 },
];

export default function AdminFinancePage() {
  const t = useTranslations('admin');

  const handleExportCSV = () => {
    const headers = ['Date', 'GMV', 'Commission', 'Payouts', 'Net'];
    const rows = dailySettlement.map((d) => [d.date, d.gmv, d.commission, d.payouts, d.net]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlement_report.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('finance.exportCSV'), { description: 'Report exported' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('finance.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">Financial overview and payout management</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
        >
          <Download className="w-4 h-4" />
          {t('finance.exportCSV')}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('finance.totalGMV')} value={formatDZD(45820000)} icon={DollarSign} />
        <StatCard title={t('finance.todayGMV')} value={formatDZD(3450000)} change={{ value: 15, positive: true }} icon={TrendingUp} />
        <StatCard title={t('finance.thisWeekGMV')} value={formatDZD(19890000)} change={{ value: 8, positive: true }} icon={Calendar} />
        <StatCard title={t('finance.thisMonthGMV')} value={formatDZD(45820000)} change={{ value: 12, positive: true }} icon={DollarSign} />
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('finance.commissionLedger')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">{t('listings.title', { defaultMessage: 'Listing' })}</th>
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.seller', { defaultMessage: 'Seller' })}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.amount')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.commission')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.netAmount')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.date')}</th>
              </tr>
            </thead>
            <tbody>
              {commissionLedger.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <td className="py-3 text-sm text-gray-900 dark:text-white">{entry.listing}</td>
                  <td className="py-3 text-sm text-gray-500">{entry.seller}</td>
                  <td className="py-3 text-sm text-right text-gray-900 dark:text-white">{formatDZD(entry.amount)}</td>
                  <td className="py-3 text-sm text-right text-error-600">-{formatDZD(entry.commission)}</td>
                  <td className="py-3 text-sm text-right font-medium text-success-600">{formatDZD(entry.net)}</td>
                  <td className="py-3 text-sm text-right text-gray-500">{entry.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <PayoutRequestCard />

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('finance.dailySettlement')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.date')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">GMV</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.commission')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">{t('finance.pendingPayouts')}</th>
                <th className="text-right py-2 text-xs font-medium text-gray-500 uppercase">Net</th>
              </tr>
            </thead>
            <tbody>
              {dailySettlement.map((day) => (
                <tr key={day.date} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                  <td className="py-3 text-sm text-gray-900 dark:text-white">{day.date}</td>
                  <td className="py-3 text-sm text-right text-gray-900 dark:text-white">{formatDZD(day.gmv)}</td>
                  <td className="py-3 text-sm text-right text-primary-600">{formatDZD(day.commission)}</td>
                  <td className="py-3 text-sm text-right text-error-600">-{formatDZD(day.payouts)}</td>
                  <td className="py-3 text-sm text-right font-bold text-success-600">{formatDZD(day.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
