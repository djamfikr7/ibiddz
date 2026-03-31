import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  const t = useTranslations('notFound');

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-primary-600 mb-4">404</div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">{t('subtitle')}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
        >
          <Home className="w-5 h-5" />
          {t('backHome')}
        </Link>
      </div>
    </div>
  );
}
