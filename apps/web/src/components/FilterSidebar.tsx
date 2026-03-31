'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { X, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
  onClear: () => void;
  resultCount: number;
  className?: string;
}

interface FilterState {
  model?: string;
  storage?: number;
  condition?: string;
  batteryMin?: number;
  priceMin?: number;
  priceMax?: number;
  wilaya?: string;
  sort?: string;
}

const models = [
  { value: 'iphone15promax', label: 'iPhone 15 Pro Max' },
  { value: 'iphone15pro', label: 'iPhone 15 Pro' },
  { value: 'iphone15', label: 'iPhone 15' },
  { value: 'iphone14promax', label: 'iPhone 14 Pro Max' },
  { value: 'iphone14pro', label: 'iPhone 14 Pro' },
  { value: 'iphone14', label: 'iPhone 14' },
  { value: 'iphone13promax', label: 'iPhone 13 Pro Max' },
  { value: 'iphone13pro', label: 'iPhone 13 Pro' },
  { value: 'iphone13', label: 'iPhone 13' },
  { value: 'iphone12promax', label: 'iPhone 12 Pro Max' },
  { value: 'iphone12pro', label: 'iPhone 12 Pro' },
  { value: 'iphone12', label: 'iPhone 12' },
  { value: 'iphone11', label: 'iPhone 11' },
  { value: 'iphonexr', label: 'iPhone XR' },
  { value: 'iphonex', label: 'iPhone X' },
];

const storageOptions = [
  { value: 64, label: '64 GB' },
  { value: 128, label: '128 GB' },
  { value: 256, label: '256 GB' },
  { value: 512, label: '512 GB' },
  { value: 1024, label: '1 TB' },
];

const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
];

const wilayas = [
  { value: 'algiers', label: 'Algiers' },
  { value: 'oran', label: 'Oran' },
  { value: 'constantine', label: 'Constantine' },
  { value: 'annaba', label: 'Annaba' },
  { value: 'blida', label: 'Blida' },
  { value: 'setif', label: 'Setif' },
  { value: 'batna', label: 'Batna' },
  { value: 'tlemcen', label: 'Tlemcen' },
  { value: 'bejaia', label: 'Bejaia' },
  { value: 'mostaganem', label: 'Mostaganem' },
];

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'priceLow', label: 'Price: Low to High' },
  { value: 'priceHigh', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most popular' },
  { value: 'battery', label: 'Best battery' },
];

export function FilterSidebar({ onFilterChange, onClear, resultCount, className }: FilterSidebarProps) {
  const t = useTranslations('listings');
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    model: true,
    storage: true,
    condition: true,
    battery: false,
    price: false,
    location: false,
    sort: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const updateFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = { ...prev, [key]: value || undefined };
      onFilterChange(newFilters);
      return newFilters;
    });
  }, [onFilterChange]);

  const clearFilters = useCallback(() => {
    setFilters({});
    onClear();
  }, [onClear]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <button
        className="lg:hidden fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <Filter className="w-5 h-5" />
        <span className="text-sm font-medium">{t('filters.title')}</span>
        {activeFilterCount > 0 && (
          <span className="w-5 h-5 bg-white text-primary-600 rounded-full text-xs font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-900 shadow-xl overflow-y-auto animate-slide-in-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('filters.title')}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <FilterContent
              filters={filters}
              updateFilter={updateFilter}
              clearFilters={clearFilters}
              expandedSections={expandedSections}
              toggleSection={toggleSection}
              resultCount={resultCount}
              t={t}
            />
          </div>
        </div>
      )}

      <aside className={cn('hidden lg:block w-72 flex-shrink-0', className)}>
        <div className="sticky top-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('filters.title')}</h2>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700">
                {t('filters.clear')}
              </button>
            )}
          </div>
          <FilterContent
            filters={filters}
            updateFilter={updateFilter}
            clearFilters={clearFilters}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            resultCount={resultCount}
            t={t}
          />
        </div>
      </aside>
    </>
  );
}

function FilterContent({
  filters,
  updateFilter,
  clearFilters,
  expandedSections,
  toggleSection,
  resultCount,
  t,
}: any) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('filters.results').replace('{count}', resultCount)}
      </p>

      <div>
        <button onClick={() => toggleSection('sort')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.sort')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.sort && 'rotate-180')} />
        </button>
        {expandedSections.sort && (
          <select
            value={filters.sort || 'newest'}
            onChange={(e) => updateFilter('sort', e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('model')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.model')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.model && 'rotate-180')} />
        </button>
        {expandedSections.model && (
          <select
            value={filters.model || ''}
            onChange={(e) => updateFilter('model', e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('filters.modelPlaceholder')}</option>
            {models.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('condition')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.condition')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.condition && 'rotate-180')} />
        </button>
        {expandedSections.condition && (
          <div className="mt-2 space-y-1">
            {conditions.map((c) => (
              <label key={c.value} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  checked={filters.condition === c.value}
                  onChange={() => updateFilter('condition', c.value)}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{c.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('storage')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.storage')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.storage && 'rotate-180')} />
        </button>
        {expandedSections.storage && (
          <div className="mt-2 flex flex-wrap gap-2">
            {storageOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => updateFilter('storage', filters.storage === s.value ? undefined : s.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                  filters.storage === s.value
                    ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-700 dark:text-primary-400'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('battery')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.batteryMin')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.battery && 'rotate-180')} />
        </button>
        {expandedSections.battery && (
          <div className="mt-2">
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={filters.batteryMin || 50}
              onChange={(e) => updateFilter('batteryMin', parseInt(e.target.value))}
              className="w-full accent-primary-600"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>50%</span>
              <span className="font-medium text-primary-600">{filters.batteryMin || 50}%+</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('price')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.priceRange')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.price && 'rotate-180')} />
        </button>
        {expandedSections.price && (
          <div className="mt-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t('filters.priceMin')}
                value={filters.priceMin || ''}
                onChange={(e) => updateFilter('priceMin', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder={t('filters.priceMax')}
                value={filters.priceMax || ''}
                onChange={(e) => updateFilter('priceMax', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <button onClick={() => toggleSection('location')} className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('filters.location')}
          <ChevronDown className={cn('w-4 h-4 transition-transform', expandedSections.location && 'rotate-180')} />
        </button>
        {expandedSections.location && (
          <select
            value={filters.wilaya || ''}
            onChange={(e) => updateFilter('wilaya', e.target.value)}
            className="w-full mt-2 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('filters.locationPlaceholder')}</option>
            {wilayas.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        )}
      </div>

      {Object.values(filters).some(Boolean) && (
        <button
          onClick={clearFilters}
          className="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {t('filters.clear')}
        </button>
      )}
    </div>
  );
}
