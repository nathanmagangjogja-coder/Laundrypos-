import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary:     { DEFAULT: 'hsl(var(--primary))',     foreground: 'hsl(var(--primary-foreground))'     },
        secondary:   { DEFAULT: 'hsl(var(--secondary))',   foreground: 'hsl(var(--secondary-foreground))'   },
        muted:       { DEFAULT: 'hsl(var(--muted))',       foreground: 'hsl(var(--muted-foreground))'       },
        accent:      { DEFAULT: 'hsl(var(--accent))',      foreground: 'hsl(var(--accent-foreground))'      },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        card:        { DEFAULT: 'hsl(var(--card))',        foreground: 'hsl(var(--card-foreground))'        },
        popover:     { DEFAULT: 'hsl(var(--popover))',     foreground: 'hsl(var(--popover-foreground))'     },
        success:     { DEFAULT: 'hsl(var(--success))',     foreground: 'hsl(var(--success-foreground))'     },
        // ═══════════════════════════════════════════════════════════════
        // LUXURY PALETTE — French Couture-inspired
        // ═══════════════════════════════════════════════════════════════
        indigo: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        purple: {
          50:  '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Champagne Gold (fashion flagship accent)
        champagne: {
          50:  '#fffdf5',
          100: '#fff9e6',
          200: '#ffefbf',
          300: '#fbe299',
          400: '#f5cf6c',
          500: '#e8b94d',   // primary gold
          600: '#d19a30',
          700: '#b07924',
          800: '#8a5e20',
          900: '#6f4c1f',
        },
        // Royal Navy
        navy: {
          50:  '#f0f4ff',
          100: '#dfe6ff',
          200: '#c2d0ff',
          300: '#94abff',
          400: '#627eff',
          500: '#3b53ff',
          600: '#2532f5',
          700: '#1d26d6',
          800: '#1e23ab',
          900: '#1f2487',
          950: '#12154a',
        },
        // Teal Luxury
        tealuxe: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        dark: {
          bg:      '#0a0c14',
          surface: '#0f1117',
          card:    '#141824',
          border:  '#1e2235',
          hover:   '#1a1f33',
        },
      },
      // ═══════════════════════════════════════════════════════════════
      // LUXURY BACKGROUNDS
      // ═══════════════════════════════════════════════════════════════
      backgroundImage: {
        'luxury-gradient':
          'linear-gradient(135deg, var(--tw-gradient-stops))',
        'bg-indigo-purple':
          'linear-gradient(135deg, #4338ca 0%, #7c3aed 50%, #a855f7 100%)',
        'bg-indigo-navy':
          'linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #3b53ff 100%)',
        'bg-gold-shimmer':
          'linear-gradient(135deg, #d19a30 0%, #f5cf6c 50%, #e8b94d 100%)',
        'bg-gentle-mesh':
          'radial-gradient(at 20% 10%, hsla(253,87%,67%,0.15) 0px, transparent 50%),\
           radial-gradient(at 80% 0%, hsla(217,91%,60%,0.15) 0px, transparent 50%),\
           radial-gradient(at 0% 50%, hsla(289,74%,67%,0.10) 0px, transparent 50%),\
           radial-gradient(at 80% 100%, hsla(42,92%,65%,0.12) 0px, transparent 50%)',
      },
      boxShadow: {
        // Standard glows
        'glow-indigo':    '0 0 20px rgba(99,102,241,0.3)',
        'glow-indigo-lg': '0 0 40px rgba(99,102,241,0.4)',
        'glow-purple':    '0 0 20px rgba(168,85,247,0.35)',
        'glow-purple-lg': '0 0 40px rgba(168,85,247,0.45)',
        'glow-gold':      '0 0 20px rgba(232,185,77,0.35)',
        'glow-gold-lg':   '0 0 40px rgba(232,185,77,0.5)',
        'glow-cyan':      '0 0 20px rgba(6,182,212,0.3)',
        'glow-green':     '0 0 20px rgba(34,197,94,0.3)',
        'glow-red':       '0 0 20px rgba(239,68,68,0.3)',
        'glow-amber':     '0 0 20px rgba(245,158,11,0.3)',
        // Luxury card shadows
        'card-dark':      '0 4px 24px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-glow':      '0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(99,102,241,0.1)',
        'card-luxe':
          '0 1px 2px rgba(15,23,42,0.04),\
           0 8px 24px -8px rgba(79,70,229,0.15),\
           0 0 0 1px rgba(99,102,241,0.06)',
        'card-luxe-gold':
          '0 1px 2px rgba(15,23,42,0.04),\
           0 8px 24px -8px rgba(232,185,77,0.25),\
           0 0 0 1px rgba(232,185,77,0.15)',
        'card-lifted':
          '0 20px 40px -15px rgba(79,70,229,0.25),\
           0 10px 20px -10px rgba(168,85,247,0.15),\
           0 0 0 1px rgba(99,102,241,0.08)',
        // Button press shadow
        'press-sm': 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -1px 2px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        'lux': '1.25rem',
      },
      // ═══════════════════════════════════════════════════════════════
      // ANIMATIONS — luxury micro-interactions
      // ═══════════════════════════════════════════════════════════════
      keyframes: {
        // Page transitions
        'page-enter': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        'page-exit': {
          '0%':   { opacity: '1', transform: 'translateY(0)'    },
          '100%': { opacity: '0', transform: 'translateY(-4px)' },
        },
        'fade-in': {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'   },
        },
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'    },
        },
        'fade-in-down': {
          '0%':   { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)'     },
        },
        'slide-in': {
          '0%':   { opacity: '0', transform: 'translateX(-14px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'     },
        },
        'slide-in-right': {
          '0%':   { opacity: '0', transform: 'translateX(14px)' },
          '100%': { opacity: '1', transform: 'translateX(0)'    },
        },
        // Scale / pop
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)'    },
        },
        'pop-in': {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { opacity: '1', transform: 'scale(1.06)' },
          '100%': { transform: 'scale(1)' },
        },
        // Glow pulses
        'pulse-blue': {
          '0%, 100%': { boxShadow: '0 0 0 0px rgba(59,130,246,0.4)'  },
          '50%':      { boxShadow: '0 0 0 10px rgba(59,130,246,0)'   },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(99,102,241,0.3)' },
          '50%':      { boxShadow: '0 0 25px rgba(99,102,241,0.6)' },
        },
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 10px rgba(232,185,77,0.35)', transform: 'translateY(0)' },
          '50%':      { boxShadow: '0 0 25px rgba(232,185,77,0.6)', transform: 'translateY(-2px)' },
        },
        // Skeleton shimmer
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0'  },
          '100%': { backgroundPosition: '200% 0'   },
        },
        // Scan line effect (for scanner screen)
        'scan-line': {
          '0%':   { top: '0%'   },
          '100%': { top: '100%' },
        },
        // Float
        float: {
          '0%, 100%': { transform: 'translateY(0px)'  },
          '50%':      { transform: 'translateY(-8px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':      { transform: 'translateY(-14px)' },
        },
        // Aurora / gradient shift
        aurora: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
        // Tilt shine (sweep light from left to right, luxury button)
        shine: {
          '0%':   { transform: 'translateX(-100%) skewX(-20deg)' },
          '100%': { transform: 'translateX(300%) skewX(-20deg)'  },
        },
        // Confetti fall
        confetti: {
          '0%':   { transform: 'translateY(0) rotate(0deg)',   opacity: '1' },
          '100%': { transform: 'translateY(400px) rotate(720deg)', opacity: '0' },
        },
        // Border spin
        'border-spin': {
          '100%': { transform: 'rotate(360deg)' },
        },
        // Wiggle
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)'  },
        },
        // Heart beat
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '14%':      { transform: 'scale(1.15)' },
          '28%':      { transform: 'scale(1)' },
          '42%':      { transform: 'scale(1.15)' },
          '70%':      { transform: 'scale(1)' },
        },
        // Count-up flash
        flash: {
          '0%':   { color: 'rgb(232,185,77)', transform: 'scale(1.05)' },
          '100%': { color: 'inherit',         transform: 'scale(1)'    },
        },
        // Bounce enter
        'bounce-in': {
          '0%':   { opacity: '0', transform: 'scale(0.3)' },
          '50%':  { opacity: '1', transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        // Page
        'page-enter': 'page-enter 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        'page-exit':  'page-exit 0.12s ease-in both',
        // Fade
        'fade-in':     'fade-in 0.3s ease-out both',
        'fade-in-up':  'fade-in-up 0.45s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-down':'fade-in-down 0.45s cubic-bezier(0.16,1,0.3,1) both',
        // Slide
        'slide-in':      'slide-in 0.3s ease-out both',
        'slide-in-right':'slide-in-right 0.3s ease-out both',
        // Scale
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16,1,0.3,1) both',
        'pop-in':   'pop-in 0.45s cubic-bezier(0.36,0,0.66,-0.56) both',
        // Pulses
        'pulse-blue':  'pulse-blue 2s infinite',
        'pulse-glow':  'pulse-glow 2s ease-in-out infinite',
        'pulse-gold':  'pulse-gold 2.2s ease-in-out infinite',
        // Skeleton
        'shimmer':   'shimmer 2s linear infinite',
        'scan-line': 'scan-line 2s linear infinite',
        // Float
        'float':      'float 3.5s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        // Aurora
        'aurora': 'aurora 8s ease infinite',
        // Shine sweep
        'shine': 'shine 2.5s ease-in-out infinite',
        // Heart beat, wiggle, confetti, flash
        'heartbeat': 'heartbeat 1.4s ease-in-out infinite',
        'wiggle':    'wiggle 0.6s ease-in-out infinite',
        'confetti':  'confetti linear forwards',
        'flash':     'flash 0.6s ease-out both',
        'bounce-in': 'bounce-in 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both',
        // Spin
        'spin-slow': 'spin 3s linear infinite',
        'border-spin': 'border-spin 8s linear infinite',
      },
      transitionTimingFunction: {
        'luxe': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      fontFamily: {
        sans: ['var(--font-sans,system-ui)', 'sans-serif'],
        display: ['var(--font-display,system-ui)', 'serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;