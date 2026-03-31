'use client';

import { useState, useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ListingCard } from '@/components/ListingCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { SlidersHorizontal, Grid3X3, List } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockListings = [
  {
    id: '1',
    title: 'iPhone 15 Pro Max 256GB Natural Titanium',
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
    title: 'iPhone 14 Pro 128GB Deep Purple',
    model: 'iPhone 14 Pro',
    storageGB: 128,
    condition: 'EXCELLENT',
    batteryHealth: 91,
    buyNowPrice: 145000,
    startingPrice: 145000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Oran',
    sellerTrustScore: 78,
    sellerName: 'Sara M.',
    featured: false,
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
    featured: false,
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
  {
    id: '5',
    title: 'iPhone 12 Pro 128GB Graphite',
    model: 'iPhone 12 Pro',
    storageGB: 128,
    condition: 'GOOD',
    batteryHealth: 82,
    buyNowPrice: 85000,
    startingPrice: 85000,
    bidCount: 0,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Blida',
    sellerTrustScore: 71,
    sellerName: 'Farid H.',
    featured: false,
    isAuction: false,
    createdAt: '2024-01-11T11:00:00Z',
  },
  {
    id: '6',
    title: 'iPhone 14 256GB Starlight',
    model: 'iPhone 14',
    storageGB: 256,
    condition: 'LIKE_NEW',
    batteryHealth: 94,
    currentBid: 102000,
    buyNowPrice: 120000,
    startingPrice: 95000,
    bidCount: 6,
    photos: ['/placeholder-phone.jpg'],
    coverPhoto: '/placeholder-phone.jpg',
    wilaya: 'Setif',
    sellerTrustScore: 83,
    sellerName: 'Lynda A.',
    featured: false,
    isAuction: true,
    createdAt: '2024-01-10T16:00:00Z',
  },
];

export default function ListingsPage() {
  const t = useTranslations('listings');
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filteredListings = useMemo(() => {
    let results = [...mockListings];

    if (filters.model) {
      results = results.filter((l) => l.model.toLowerCase().includes(filters.model.toLowerCase()));
    }
    if (filters.condition) {
      results = results.filter((l) => l.condition === filters.condition);
    }
    if (filters.storage) {
      results = results.filter((l) => l.storageGB === filters.storage);
    }
    if (filters.batteryMin) {
      results = results.filter((l) => l.batteryHealth >= filters.batteryMin);
    }
    if (filters.priceMin) {
      const price = filters.priceMin;
      results = results.filter((l) => (l.currentBid || l.startingPrice) >= price);
    }
    if (filters.priceMax) {
      const price = filters.priceMax;
      results = results.filter((l) => (l.currentBid || l.startingPrice) <= price);
    }
    if (filters.wilaya) {
      results = results.filter((l) => l.wilaya.toLowerCase().includes(filters.wilaya.toLowerCase()));
    }
    if (filters.sort === 'priceLow') {
      results.sort((a, b) => (a.currentBid || a.startingPrice) - (b.currentBid || b.startingPrice));
    } else if (filters.sort === 'priceHigh') {
      results.sort((a, b) => (b.currentBid || b.startingPrice) - (a.currentBid || a.startingPrice));
    } else if (filters.sort === 'battery') {
      results.sort((a, b) => b.batteryHealth - a.batteryHealth);
    }

    return results;
  }, [filters]);

  const handleFilterChange = useCallback((newFilters: Record<string, any>) => {
    setFilters(newFilters);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{t('subtitle')}</p>
      </div>

      <div className="flex gap-8">
        <FilterSidebar
          onFilterChange={handleFilterChange}
          onClear={handleClearFilters}
          resultCount={filteredListings.length}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {filteredListings.length} results
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600'
                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>

          {filteredListings.length === 0 ? (
            <div className="text-center py-16">
              <SlidersHorizontal className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters</p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={cn(
              'grid gap-6',
              viewMode === 'grid'
                ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                : 'grid-cols-1'
            )}>
              {filteredListings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
