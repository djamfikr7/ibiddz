'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ArrowLeft, Shield } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { validatePhone, formatPhone } from '@/lib/utils';
import { toast } from 'sonner';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { sendOtp, login } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePhone(phone)) {
      setError(t('phoneInvalid'));
      return;
    }

    setIsLoading(true);
    try {
      await sendOtp(phone);
      setStep('otp');
      setResendTimer(60);
      const interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      toast.success(t('otpSent'));
    } catch (err: any) {
      setError(err.response?.data?.message || t('phoneInvalid'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.length !== 6) {
      setError(t('otpInvalid'));
      return;
    }

    setIsLoading(true);
    try {
      await login(phone, code);
      toast.success(t('loginSuccess'));
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      if (msg?.includes('expired')) setError(t('otpExpired'));
      else if (msg?.includes('attempts')) setError(t('tooManyAttempts'));
      else setError(t('otpInvalid'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-3xl font-bold text-primary-600 mb-2">iBidDZ</Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('loginTitle')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('loginSubtitle')}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('phoneLabel')}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ''))}
                    placeholder={t('phonePlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                    dir="ltr"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('sendOtp')}
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Code sent to <span className="font-medium text-gray-900 dark:text-white" dir="ltr">{formatPhone(phone)}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('otpLabel')}
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder={t('otpPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-900 dark:text-white"
                  dir="ltr"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/20 px-4 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || code.length !== 6}
                className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  t('verifyOtp')
                )}
              </button>

              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('resendIn').replace('{seconds}', resendTimer.toString())}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    {t('resendCode')}
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setCode(''); setError(null); }}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                <span className="flex items-center justify-center gap-1">
                  <ArrowLeft className="w-4 h-4" />
                  {t('back')}
                </span>
              </button>
            </form>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
            {t('byContinuing')}{' '}
            <Link href="#" className="text-primary-600 hover:underline">{t('terms')}</Link>{' '}
            {t('and')}{' '}
            <Link href="#" className="text-primary-600 hover:underline">{t('privacy')}</Link>
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Shield className="w-4 h-4 text-success-500" />
          <span>Secured with SMS verification</span>
        </div>
      </div>
    </div>
  );
}
