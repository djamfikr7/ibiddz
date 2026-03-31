import type { Metadata } from 'next';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { Providers } from '@/components/Providers';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-sans-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'iBidDZ - Algeria\'s Trusted iPhone Marketplace',
    template: '%s | iBidDZ',
  },
  description: 'Buy and sell pre-owned iPhones in Algeria with trust scoring, live auctions, and secure cash-on-delivery.',
  keywords: ['iPhone', 'Algeria', 'marketplace', 'auction', 'buy', 'sell', 'used phones', 'DZD'],
  authors: [{ name: 'iBidDZ' }],
  openGraph: {
    title: 'iBidDZ - Algeria\'s Trusted iPhone Marketplace',
    description: 'Buy and sell pre-owned iPhones in Algeria with trust scoring, live auctions, and secure cash-on-delivery.',
    type: 'website',
    locale: 'en_US',
    siteName: 'iBidDZ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'iBidDZ - Algeria\'s Trusted iPhone Marketplace',
    description: 'Buy and sell pre-owned iPhones in Algeria.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoSansArabic.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
