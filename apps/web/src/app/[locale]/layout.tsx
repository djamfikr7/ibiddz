import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing, rtlLocales } from '@/i18n/routing';
import { Navbar } from '@/components/Navbar';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: 'common' });
  return {
    title: t('appName'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(params.locale as any)) {
    notFound();
  }

  const messages = await getMessages();
  const isRtl = rtlLocales.includes(params.locale as any);

  return (
    <NextIntlClientProvider messages={messages}>
      <div dir={isRtl ? 'rtl' : 'ltr'} className={isRtl ? 'font-arabic' : 'font-sans'}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-1">
                <h3 className="text-lg font-bold text-primary-600 mb-3">iBidDZ</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Algeria's most trusted marketplace for pre-owned iPhones. Buy and sell with confidence.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Quick Links</h4>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li><a href="/listings" className="hover:text-primary-600 transition-colors">Browse Listings</a></li>
                  <li><a href="/auctions" className="hover:text-primary-600 transition-colors">Live Auctions</a></li>
                  <li><a href="/listings/create" className="hover:text-primary-600 transition-colors">Sell Your iPhone</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Return Policy</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Support</h4>
                <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-primary-600 transition-colors">FAQ</a></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-gray-400">
              © {new Date().getFullYear()} iBidDZ. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </NextIntlClientProvider>
  );
}
