'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Image as ImageIcon, MessageSquare, CheckCircle, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import { formatDZD } from '@/lib/utils';
import { toast } from 'sonner';

interface Dispute {
  id: string;
  orderId: string;
  buyerName: string;
  sellerName: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
  amount: number;
  openedAt: string;
  slaDeadline: string;
  evidence: { type: 'photo' | 'chat'; content: string }[];
  history: { action: string; by: string; at: string }[];
}

const mockDisputes: Dispute[] = [
  {
    id: 'd1', orderId: 'o101', buyerName: 'Ahmed Benali', sellerName: 'Sara Khelifi',
    reason: 'Item not as described - battery health was listed as 90% but actual is 75%',
    priority: 'HIGH', status: 'OPEN', amount: 185000,
    openedAt: '2024-06-01T10:00:00Z', slaDeadline: '2024-06-04T10:00:00Z',
    evidence: [
      { type: 'photo', content: 'Screenshot of battery health' },
      { type: 'chat', content: 'Buyer: The battery health is much lower than advertised' },
      { type: 'chat', content: 'Seller: I listed it accurately, it was 90% when I checked' },
    ],
    history: [
      { action: 'Dispute opened', by: 'Ahmed Benali', at: '2024-06-01T10:00:00Z' },
      { action: 'Evidence submitted', by: 'Ahmed Benali', at: '2024-06-01T10:15:00Z' },
    ],
  },
  {
    id: 'd2', orderId: 'o102', buyerName: 'Fatima Zohra', sellerName: 'Karim Hadj',
    reason: 'Device does not turn on - possible hardware issue',
    priority: 'HIGH', status: 'ESCALATED', amount: 95000,
    openedAt: '2024-05-30T14:00:00Z', slaDeadline: '2024-06-02T14:00:00Z',
    evidence: [
      { type: 'photo', content: 'Photo of device not turning on' },
    ],
    history: [
      { action: 'Dispute opened', by: 'Fatima Zohra', at: '2024-05-30T14:00:00Z' },
      { action: 'Escalated to admin', by: 'System', at: '2024-06-01T14:00:00Z' },
    ],
  },
  {
    id: 'd3', orderId: 'o103', buyerName: 'Amina Boudiaf', sellerName: 'Ahmed Benali',
    reason: 'Wrong color delivered - ordered Space Black, received Silver',
    priority: 'MEDIUM', status: 'OPEN', amount: 55000,
    openedAt: '2024-06-01T16:00:00Z', slaDeadline: '2024-06-04T16:00:00Z',
    evidence: [
      { type: 'photo', content: 'Photo of received device' },
      { type: 'chat', content: 'Buyer: I received a silver iPhone, not the space black I ordered' },
    ],
    history: [
      { action: 'Dispute opened', by: 'Amina Boudiaf', at: '2024-06-01T16:00:00Z' },
    ],
  },
];

export function DisputeCard() {
  const t = useTranslations('admin');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  const getSLAStatus = (deadline: string) => {
    const now = new Date();
    const sla = new Date(deadline);
    const diff = sla.getTime() - now.getTime();
    if (diff < 0) return { label: t('disputes.slaBreached'), color: 'text-error-600 bg-error-50 dark:bg-error-900/30' };
    if (diff < 86400000) return { label: t('disputes.slaWarning'), color: 'text-warning-600 bg-warning-50 dark:bg-warning-900/30' };
    return { label: t('disputes.slaOnTrack'), color: 'text-success-600 bg-success-50 dark:bg-success-900/30' };
  };

  const handleResolve = (dispute: Dispute, action: string) => {
    toast.success(t('disputes.resolution'), { description: `${action} applied to dispute ${dispute.id}` });
    setSelectedDispute(null);
    setResolutionNote('');
    setRefundAmount('');
  };

  const priorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400',
      MEDIUM: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      LOW: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${styles[priority]}`}>
        {t(`disputes.${priority.toLowerCase()}`)}
      </span>
    );
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      OPEN: 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400',
      RESOLVED: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      ESCALATED: 'bg-error-50 text-error-700 dark:bg-error-900/30 dark:text-error-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (selectedDispute) {
    const sla = getSLAStatus(selectedDispute.slaDeadline);
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedDispute(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('common.back', { defaultMessage: 'Back' })}
        </button>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('disputes.disputeId')}: {selectedDispute.id}</h3>
                {priorityBadge(selectedDispute.priority)}
                {statusBadge(selectedDispute.status)}
              </div>
              <p className="text-sm text-gray-500">{selectedDispute.reason}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDZD(selectedDispute.amount)}</p>
              <p className="text-xs text-gray-500">{t('disputes.order')}: {selectedDispute.orderId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-1">{t('disputes.buyer')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedDispute.buyerName}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-xs text-gray-500 mb-1">{t('disputes.seller')}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedDispute.sellerName}</p>
            </div>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${sla.color}`}>
            <Clock className="w-4 h-4" />
            {sla.label} - SLA: {new Date(selectedDispute.slaDeadline).toLocaleString()}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('disputes.evidence')}</h4>
          <div className="space-y-3">
            {selectedDispute.evidence.map((ev, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                {ev.type === 'photo' ? (
                  <ImageIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <MessageSquare className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-gray-700 dark:text-gray-300">{ev.content}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('disputes.resolution')}</h4>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleResolve(selectedDispute, 'Partial Refund')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-warning-600 text-white hover:bg-warning-700"
            >
              {t('disputes.partialRefund')}
            </button>
            <button
              onClick={() => handleResolve(selectedDispute, 'Full Return & Refund')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-error-600 text-white hover:bg-error-700"
            >
              {t('disputes.fullReturn')}
            </button>
            <button
              onClick={() => handleResolve(selectedDispute, 'Close - No Action')}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-success-600 text-white hover:bg-success-700"
            >
              {t('disputes.closeDispute')}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder={t('disputes.refundAmount')}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          <textarea
            placeholder={t('disputes.resolutionNotePlaceholder')}
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm mb-4"
            rows={3}
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('disputes.history')}</h4>
          <div className="space-y-3">
            {selectedDispute.history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{h.action}</p>
                  <p className="text-xs text-gray-500">{h.by} · {new Date(h.at).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {mockDisputes.map((dispute) => {
          const sla = getSLAStatus(dispute.slaDeadline);
          return (
            <button
              key={dispute.id}
              onClick={() => setSelectedDispute(dispute)}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 text-left hover:border-primary-200 dark:hover:border-primary-800 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">{dispute.id}</span>
                    {priorityBadge(dispute.priority)}
                    {statusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{dispute.reason}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>{t('disputes.buyer')}: {dispute.buyerName}</span>
                    <span>{t('disputes.seller')}: {dispute.sellerName}</span>
                    <span>{t('disputes.order')}: {dispute.orderId}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatDZD(dispute.amount)}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mt-1 ${sla.color}`}>
                    <Clock className="w-3 h-3" />
                    {sla.label}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
