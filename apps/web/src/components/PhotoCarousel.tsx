'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoCarouselProps {
  photos: string[];
  alt: string;
  className?: string;
}

export function PhotoCarousel({ photos, alt, className }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  if (!photos || photos.length === 0) {
    return (
      <div className={cn('relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center', className)}>
        <span className="text-gray-400 text-sm">No photos</span>
      </div>
    );
  }

  return (
    <>
      <div className={cn('relative group', className)}>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-700">
          <Image
            src={photos[currentIndex] || '/placeholder-phone.jpg'}
            alt={`${alt} - Photo ${currentIndex + 1}`}
            fill
            className="object-cover cursor-zoom-in"
            sizes="(max-width: 768px) 100vw, 600px"
            onClick={() => setIsZoomed(true)}
          />

          {photos.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-gray-800"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              </button>
              <button
                onClick={() => setIsZoomed(true)}
                className="absolute bottom-2 right-2 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Zoom photo"
              >
                <ZoomIn className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md">
                {currentIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  'relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                  index === currentIndex
                    ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                    : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                )}
              >
                <Image
                  src={photo}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {isZoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
            className="absolute left-4 p-2 text-white/80 hover:text-white"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goNext(); }}
            className="absolute right-4 p-2 text-white/80 hover:text-white"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          <div className="relative max-w-4xl max-h-[80vh] aspect-[4/3]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[currentIndex]}
              alt={`${alt} - Photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              sizes="80vw"
            />
          </div>
        </div>
      )}
    </>
  );
}
