'use client';

import { useTranslations } from 'next-intl';
import { CheckCircle, XCircle, Flag, AlertTriangle, Image as ImageIcon, MessageSquare, DollarSign, FileText } from 'lucide-react';
import { getConditionLabel, getConditionColor, formatDZD } from '@/lib/utils';
import { toast } from 'sonner';
import { useState } from 'react';

interface Listing {
  id: string;
  title: string;
  model: string;
  storage: number;
  condition: string;
  price: number;
  sellerName: string;
  sellerId: string;
  status: 'PENDING' | 'FLAGGED' | 'APPROVED' | 'REJECTED';
  flagReasons?: string[];
  imageUrl?: string;
  createdAt: string;
}

const mockListings: Listing[] = [
  { id: 'l1', title: 'iPhone 14 Pro Max 256GB', model: 'iPhone 14 Pro Max', storage: 256, condition: 'EXCELLENT', price: 185000, sellerName: 'Ahmed B.', sellerId: 'u1', status: 'PENDING', imageUrl: '', createdAt: '2024-06-01T10:00:00Z' },
  { id: 'l2', title: 'iPhone 13 128GB Like New', model: 'iPhone 13', storage: 128, condition: 'LIKE_NEW', price: 95000, sellerName: 'Fatima Z.', sellerId: 'u2', status: 'FLAGGED', flagReasons: ['suspicious_price'], imageUrl: '', createdAt: '2024-06-01T09:30:00Z' },
  { id: 'l3', title: 'iPhone 15 Pro 512GB', model: 'iPhone 15 Pro', storage: 512, condition: 'NEW', price: 250000, sellerName: 'Sara K.', sellerId: 'u6', status: 'PENDING', imageUrl: '', createdAt: '2024-06-01T08:15:00Z' },
  { id: 'l4', title: 'iPhone 12 64GB Good Condition', model: 'iPhone 12', storage: 64, condition: 'GOOD', price: 55000, sellerName: 'Amina B.', sellerId: 'u8', status: 'FLAGGED', flagReasons: ['nlp_flag', 'incomplete_info'], imageUrl: '', createdAt: '2024-05-31T16:00:00Z' },
  { id: 'l5', title: 'iPhone 11 Pro 256GB', model: 'iPhone 11 Pro', storage: 256, condition: 'FAIR', price: 42000, sellerName: 'Karim H.', sellerId: 'u3', status: 'PENDING', imageUrl: '', createdAt: '2024-05-31T14:20:00Z' },
];

const flagReasonLabels: Record<string, string> = {
  nlp_flag: 'NLP Flag',
  duplicate_image: 'Duplicate Image',
  suspicious_price: 'Suspicious Price',
  incomplete_info: 'Incomplete Info',
  report_abuse: 'Reported for Abuse',
};

export function ListingModerationCard() {
  const t = useTranslations('admin');
  const [tab, setTab] = useState<'pending' | 'flagged'>('pending');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = mockListings.filter((l) => {
    if (tab === 'pending') return l.status === 'PENDING';
    return l.status === 'FLAGGED';
  });

  const handleApprove = (id: string) => {
    toast.success(t('listings.approve'), { description: `Listing ${id} approved` });
  };

  const handleReject = (id: string) => {
    toast.error(t('listings.reject'), { description: `Listing ${id} rejected` });
    setRejectModal(null);
    setRejectReason('');
  };

  const handleBulkApprove = () => {
    selected.forEach((id) => handleApprove(id));
    setSelected(new Set());
  };

  const handleBulkReject = () => {
    selected.forEach((id) => handleReject(id));
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((l) => l.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'pending' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          {t('listings.pending')} ({mockListings.filter((l) => l.status === 'PENDING').length})
        </button>
        <button
          onClick={() => setTab('flagged')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'flagged' ? 'bg-error-600 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}
        >
          {t('listings.flagged')} ({mockListings.filter((l) => l.status === 'FLAGGED').length})
        </button>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
          <span className="text-sm text-primary-700 dark:text-primary-300">{selected.size} selected</span>
          <button onClick={handleBulkApprove} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-success-600 text-white hover:bg-success-700">
            {t('listings.bulkApprove')}
          </button>
          <button onClick={handleBulkReject} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700">
            {t('listings.bulkReject')}
          </button>
        </div>
      )}

      <div className="grid gap-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {tab === 'pending' ? t('listings.noPendingListings') : t('listings.noFlaggedListings')}
          </div>
        ) : (
          filtered.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selected.has(listing.id)}
                  onChange={() => toggleSelect(listing.id)}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{listing.title}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{listing.model} · {listing.storage}GB</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getConditionColor(listing.condition)}`}>
                          {getConditionLabel(listing.condition)}
                        </span>
                        <span className="text-sm font-bold text-primary-600">{formatDZD(listing.price)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="p-2 rounded-lg text-success-600 hover:bg-success-50 dark:hover:bg-success-900/30 transition-colors"
                        title={t('listings.approve')}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setRejectModal(listing.id)}
                        className="p-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors"
                        title={t('listings.reject')}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>Seller: {listing.sellerName}</span>
                    <span>{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                  {listing.flagReasons && listing.flagReasons.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {listing.flagReasons.map((reason) => (
                        <span key={reason} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400">
                          <AlertTriangle className="w-3 h-3" />
                          {flagReasonLabels[reason] || reason}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('listings.reject')}</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={t('listings.rejectReasonPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-4"
              rows={3}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('common.cancel', { defaultMessage: 'Cancel' })}
              </button>
              <button
                onClick={() => handleReject(rejectModal)}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700"
              >
                {t('listings.reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
