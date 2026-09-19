/**
 * Medical Trip Colombia S.A.S. - useMediaQuery Hook
 * Responsive viewport detection for Mobile (<768px), Tablet (768px-1023px), and Desktop (>=1024px).
 */

import { useState, useEffect } from 'react';

export type ViewportMode = 'mobile' | 'tablet' | 'desktop';

export interface ViewportState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportMode: ViewportMode;
  width: number;
}

export function useMediaQuery(): ViewportState {
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth;
    }
    return 1280;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  const viewportMode: ViewportMode = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  return {
    isMobile,
    isTablet,
    isDesktop,
    viewportMode,
    width,
  };
}
