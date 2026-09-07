'use client';

/**
 * components/layout/PageTransition.tsx
 *
 * Wrap <main> content dengan komponen ini untuk smooth page transition.
 * Tidak butuh framer-motion — murni CSS animation via key={pathname}.
 *
 * Cara pakai di layout.tsx:
 *   import { PageTransition } from '@/components/layout/PageTransition';
 *   <PageTransition>{children}</PageTransition>
 */

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<'enter' | 'exit'>('enter');
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // 1. Trigger exit pada konten lama
      setTransitionStage('exit');

      // 2. Setelah animasi exit selesai (120ms), ganti konten & masuk
      const t = setTimeout(() => {
        setDisplayChildren(children);
        setTransitionStage('enter');
        prevPathname.current = pathname;
      }, 120);

      return () => clearTimeout(t);
    } else {
      // Halaman sama (refresh/init) — langsung masuk
      setDisplayChildren(children);
      setTransitionStage('enter');
    }
  }, [pathname, children]);

  return (
    <div
      className={cn(
        'transition-all duration-200 will-change-[opacity,transform]',
        transitionStage === 'enter'
          ? 'animate-page-enter'
          : 'animate-page-exit',
        className,
      )}
    >
      {displayChildren}
    </div>
  );
}