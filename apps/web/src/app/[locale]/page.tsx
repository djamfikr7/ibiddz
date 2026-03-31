import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowRight, Shield, Truck, Gavel, Star, Users, Smartphone, CheckCircle } from 'lucide-react';
import { ListingCard } from '@/components/ListingCard';

const featuredListings = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max 256GB',
    model: 'iPhone 15 Pro Max',
    storageGB: 256,
    condition: 'LIKE_NEW',
    batteryHealth: 98,
    currentBid: 185000,
    buyNowPrice: 210000,
    startingPrice: 175000,
    bidCount: 12,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Algiers',
    sellerTrustScore: 92,
    sellerName: 'Ahmed K.',
    featured: true,
    isAuction: true,
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'iPhone 14 Pro 128GB Blue',
    model: 'iPhone 14 Pro',
    storageGB: 128,
    condition: 'EXCELLENT',
    batteryHealth: 91,
    currentBid: undefined,
    buyNowPrice: 145000,
    startingPrice: 145000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Oran',
    sellerTrustScore: 78,
    sellerName: 'Sara M.',
    featured: true,
    isAuction: false,
    createdAt: '2024-01-14T15:30:00Z',
  },
  {
    id: '3',
    title: 'iPhone 13 256GB Midnight',
    model: 'iPhone 13',
    storageGB: 256,
    condition: 'GOOD',
    batteryHealth: 85,
    currentBid: 78000,
    buyNowPrice: 95000,
    startingPrice: 70000,
    bidCount: 8,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Constantine',
    sellerTrustScore: 65,
    sellerName: 'Karim B.',
    featured: true,
    isAuction: true,
    createdAt: '2024-01-13T09:00:00Z',
  },
  {
    id: '4',
    title: 'iPhone 15 128GB Pink',
    model: 'iPhone 15',
    storageGB: 128,
    condition: 'NEW',
    batteryHealth: 100,
    currentBid: undefined,
    buyNowPrice: 165000,
    startingPrice: 165000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Annaba',
    sellerTrustScore: 88,
    sellerName: 'Nour L.',
    featured: true,
    isAuction: false,
    createdAt: '2024-01-12T14:00:00Z',
  },
];

const liveAuctions = [
  {
    id: 'a1',
    title: 'iPhone 15 Pro 256GB Natural Titanium',
    model: 'iPhone 15 Pro',
    storageGB: 256,
    condition: 'LIKE_NEW',
    batteryHealth: 96,
    currentBid: 162000,
    startingPrice: 150000,
    bidCount: 24,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Blida',
    sellerTrustScore: 95,
    sellerName: 'Yacine T.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-15T18:00:00Z',
  },
  {
    id: 'a2',
    title: 'iPhone 14 128GB Starlight',
    model: 'iPhone 14',
    storageGB: 128,
    condition: 'EXCELLENT',
    batteryHealth: 89,
    currentBid: 95000,
    startingPrice: 85000,
    bidCount: 15,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Setif',
    sellerTrustScore: 72,
    sellerName: 'Amina R.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-15T17:00:00Z',
  },
];

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djZoLTZWMzRoNnptMC0zMHY2aC02VjRoNnptMCA2MHY2aC02di02aDZ6bS0zMi0zMHY2SDRWNGg2em0wIDMwdjZINHYtNmg2eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {t('heroTitle')}
            </h1>
            <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto mb-10">
              {t('heroSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/listings"
                className="flex items-center gap-2 px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors shadow-lg"
              >
                {t('browseListings')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/auctions"
                className="flex items-center gap-2 px-8 py-4 bg-primary-500/30 text-white border border-white/30 rounded-xl font-semibold hover:bg-primary-500/50 transition-colors"
              >
                <Gavel className="w-5 h-5" />
                {t('viewAuctions')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Smartphone, value: '2,500+', label: 'Active Listings' },
              { icon: Users, value: '8,000+', label: 'Verified Users' },
              { icon: CheckCircle, value: '15,000+', label: 'Successful Transactions' },
              { icon: Star, value: '48', label: 'Wilayas Covered' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-xl bg-gray-50 dark:bg-gray-800">
                <stat.icon className="w-8 h-8 mx-auto mb-3 text-primary-600" />
                <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('featuredListings')}</h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Handpicked deals from trusted sellers</p>
            </div>
            <Link href="/listings" className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} {...listing} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/listings" className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
              View all listings <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-error-500"></span>
                </span>
                {t('liveAuctions')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Bid in real-time and win great deals</p>
            </div>
            <Link href="/auctions" className="hidden sm:flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium">
              View all auctions <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveAuctions.map((auction) => (
              <ListingCard key={auction.id} {...auction} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">{t('howItWorks')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Smartphone, step: '1', title: t('step1Title'), desc: t('step1Desc') },
              { icon: Gavel, step: '2', title: t('step2Title'), desc: t('step2Desc') },
              { icon: Truck, step: '3', title: t('step3Title'), desc: t('step3Desc') },
            ].map((item, i) => (
              <div key={i} className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="inline-block px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full mb-3">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">{t('trustTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: t('trustScore'), desc: t('trustScoreDesc') },
              { icon: CheckCircle, title: t('codProtection'), desc: t('codProtectionDesc') },
              { icon: Star, title: t('moderation'), desc: t('moderationDesc') },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-8">
                <div className="w-14 h-14 bg-success-100 dark:bg-success-900/30 rounded-xl flex items-center justify-center mb-4">
                  <item.icon className="w-7 h-7 text-success-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
