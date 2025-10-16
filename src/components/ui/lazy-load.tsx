'use client';

import React, { useEffect, useRef, useState, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LazyLoadProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  placeholder?: ReactNode;
  onVisible?: () => void;
  once?: boolean;
}

export function LazyLoad({
  children,
  className,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder,
  onVisible,
  once = true,
}: LazyLoadProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            
            if (!hasBeenVisible) {
              setHasBeenVisible(true);
              onVisible?.();
            }

            if (once && containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [threshold, rootMargin, onVisible, once, hasBeenVisible]);

  return (
    <div ref={containerRef} className={className}>
      {(once ? hasBeenVisible : isVisible) ? (
        children
      ) : (
        placeholder || <DefaultPlaceholder />
      )}
    </div>
  );
}

function DefaultPlaceholder() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

// Virtual scrolling component for large lists
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  className?: string;
  containerHeight?: number;
  overscan?: number;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  className,
  containerHeight = 600,
  overscan = 3,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = () => {
    if (scrollElementRef.current) {
      setScrollTop(scrollElementRef.current.scrollTop);
    }
  };

  return (
    <div
      ref={scrollElementRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Image lazy loading with blur placeholder
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className,
  placeholderSrc,
  onLoad,
  onError,
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState(placeholderSrc || '');
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <LazyLoad
      className={cn('relative overflow-hidden', className)}
      onVisible={() => {
        const img = new Image();
        img.src = src;
        
        img.onload = () => {
          setImageSrc(src);
          setImageLoading(false);
          onLoad?.();
        };
        
        img.onerror = () => {
          setImageError(true);
          setImageLoading(false);
          onError?.();
        };
      }}
      placeholder={
        placeholderSrc ? (
          <img
            src={placeholderSrc}
            alt={alt}
            className={cn('w-full h-full object-cover blur-sm', className)}
          />
        ) : (
          <div className={cn('bg-muted animate-pulse', className)} />
        )
      }
    >
      {imageError ? (
        <div className={cn('flex items-center justify-center bg-muted', className)}>
          <span className="text-muted-foreground text-sm">Failed to load image</span>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-all duration-300',
            imageLoading && 'blur-sm',
            className
          )}
        />
      )}
    </LazyLoad>
  );
}
