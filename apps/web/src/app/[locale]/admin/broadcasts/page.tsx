'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Send, Clock, Users, BarChart3, Eye, MousePointer, CheckCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Broadcast {
  id: string;
  title: string;
  message: string;
  channels: string[];
  audience: string;
  status: 'SENT' | 'SCHEDULED' | 'DRAFT';
  sentAt?: string;
  scheduledAt?: string;
  analytics?: {
    sent: number;
    delivered: number;
    read: number;
    clickRate: string;
  };
}

const mockBroadcasts: Broadcast[] = [
  {
    id: 'b1', title: 'New iPhone 15 Listings', message: 'Check out the latest iPhone 15 listings from verified sellers across Algeria!',
    channels: ['push', 'inapp'], audience: 'all', status: 'SENT', sentAt: '2024-06-01T10:00:00Z',
    analytics: { sent: 2847, delivered: 2650, read: 1890, clickRate: '24.5%' },
  },
  {
    id: 'b2', title: 'Weekend Auction Event', message: 'Join our special weekend auction with exclusive deals on premium iPhones.',
    channels: ['push', 'email'], audience: 'active', status: 'SCHEDULED', scheduledAt: '2024-06-08T09:00:00Z',
  },
  {
    id: 'b3', title: 'Trust Score Update', message: 'Your trust score has been updated. Check your dashboard for details.',
    channels: ['push'], audience: 'all', status: 'DRAFT',
  },
];

const channelLabels: Record<string, string> = {
  push: 'Push Notification',
  inapp: 'In-App Banner',
  email: 'Email',
  sms: 'SMS',
};

const audienceLabels: Record<string, string> = {
  all: 'All Users',
  active: 'Active Users',
  sellers: 'Sellers',
  buyers: 'Buyers',
};

export default function AdminBroadcastsPage() {
  const t = useTranslations('admin');
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formChannels, setFormChannels] = useState<string[]>(['push']);
  const [formAudience, setFormAudience] = useState('all');
  const [formSchedule, setFormSchedule] = useState<'now' | 'later'>('now');
  const [formDate, setFormDate] = useState('');

  const toggleChannel = (ch: string) => {
    setFormChannels((prev) => prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]);
  };

  const handleSend = () => {
    if (!formTitle || !formMessage) {
      toast.error('Error', { description: 'Title and message are required' });
      return;
    }
    if (formSchedule === 'later' && !formDate) {
      toast.error('Error', { description: 'Please select a date' });
      return;
    }
    if (formSchedule === 'now') {
      toast.success(t('broadcasts.broadcastSent'), { description: formTitle });
    } else {
      toast.success(t('broadcasts.broadcastScheduled'), { description: formTitle });
    }
    setShowForm(false);
    setFormTitle('');
    setFormMessage('');
    setFormChannels(['push']);
    setFormAudience('all');
    setFormSchedule('now');
    setFormDate('');
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      SENT: 'bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400',
      SCHEDULED: 'bg-warning-50 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
      DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
        {t(`broadcasts.${status.toLowerCase()}`)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('broadcasts.title')}</h1>
          <p className="text-sm text-gray-500 mt-1">Send and manage platform announcements</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
        >
          <Send className="w-4 h-4" />
          {t('broadcasts.sendBroadcast')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('broadcasts.sendBroadcast')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('broadcasts.title')}</label>
              <input
                type="text"
                placeholder={t('broadcasts.titlePlaceholder')}
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('broadcasts.message')}</label>
              <textarea
                placeholder={t('broadcasts.messagePlaceholder')}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('broadcasts.channels')}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(channelLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => toggleChannel(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formChannels.includes(key)
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(`broadcasts.${key === 'inapp' ? 'inAppBanner' : key}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('broadcasts.targetAudience')}</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(audienceLabels).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setFormAudience(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      formAudience === key
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  >
                    {t(`broadcasts.${key === 'all' ? 'allUsers' : key === 'active' ? 'activeUsers' : key}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('broadcasts.schedule')}</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setFormSchedule('now')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formSchedule === 'now' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  {t('broadcasts.sendNow')}
                </button>
                <button
                  onClick={() => setFormSchedule('later')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formSchedule === 'later' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  {t('broadcasts.scheduleForLater')}
                </button>
              </div>
              {formSchedule === 'later' && (
                <input
                  type="datetime-local"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                />
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                {t('broadcasts.cancel')}
              </button>
              <button
                onClick={handleSend}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700"
              >
                {formSchedule === 'now' ? t('broadcasts.sendNow') : t('broadcasts.scheduleForLater')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {mockBroadcasts.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('broadcasts.noBroadcasts')}</div>
        ) : (
          mockBroadcasts.map((broadcast) => (
            <div key={broadcast.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast.title}</h4>
                    {statusBadge(broadcast.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{broadcast.message}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {broadcast.channels.map((ch) => (
                      <span key={ch} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                        {channelLabels[ch]}
                      </span>
                    ))}
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      {audienceLabels[broadcast.audience]}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {broadcast.sentAt && (
                    <p className="text-xs text-gray-500">Sent: {new Date(broadcast.sentAt).toLocaleDateString()}</p>
                  )}
                  {broadcast.scheduledAt && (
                    <p className="text-xs text-gray-500">Scheduled: {new Date(broadcast.scheduledAt).toLocaleString()}</p>
                  )}
                </div>
              </div>

              {broadcast.analytics && (
                <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('broadcasts.sentCount')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast.analytics.sent.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('broadcasts.deliveredCount')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast.analytics.delivered.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('broadcasts.readCount')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast.analytics.read.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointer className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t('broadcasts.clickRate')}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{broadcast.analytics.clickRate}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
