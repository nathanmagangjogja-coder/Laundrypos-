'use client';
// hooks/useDarkMode.ts
// Hook ini sudah benar — masalah dark mode BUKAN di sini
// Root cause ada di layout.tsx (ThemeProvider) atau tailwind.config.ts (darkMode: 'class')

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

export function useDarkMode() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // resolvedTheme handles 'system' correctly — resolves to actual 'light' or 'dark'
  // Do NOT use `theme` here because theme could be 'system', not 'light'/'dark'
  const isDark = mounted ? resolvedTheme === 'dark' : false;

  const toggle = () => {
    // Always toggle based on current resolved state
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  return { isDark, toggle, mounted };
}