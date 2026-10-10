/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1.25rem',
        sm: '1.5rem',
        lg: '2rem',
      },
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          1: 'rgb(var(--surface-1) / <alpha-value>)',
          2: 'rgb(var(--surface-2) / <alpha-value>)',
          3: 'rgb(var(--surface-3) / <alpha-value>)',
        },
        inset: 'rgb(var(--inset) / <alpha-value>)',
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        faint: 'rgb(var(--faint) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        'border-strong': 'rgb(var(--border-strong) / <alpha-value>)',
        input: 'rgb(var(--input) / <alpha-value>)',
        ring: 'rgb(var(--ring) / <alpha-value>)',
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        hot: {
          DEFAULT: 'rgb(var(--hot) / <alpha-value>)',
          foreground: 'rgb(var(--hot-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          foreground: 'rgb(var(--danger-foreground) / <alpha-value>)',
        },
        ink: {
          50: '#f7f5f1',
          100: '#eae7df',
          200: '#d6d1c4',
          300: '#b6af9e',
          400: '#908878',
          500: '#6c6557',
          600: '#524c40',
          700: '#3b372f',
          800: '#282520',
          900: '#1a1815',
          950: '#0d0c0b',
        },
      },
      fontFamily: {
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Bricolage Grotesque Variable"', '"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.045em',
        display: '-0.02em',
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        surface: 'inset 0 1px 0 rgb(255 255 255 / 0.03), 0 1px 2px rgb(0 0 0 / 0.4)',
        elevate: 'inset 0 1px 0 rgb(255 255 255 / 0.05), 0 12px 28px -12px rgb(0 0 0 / 0.65)',
        overlay: '0 24px 70px -20px rgb(0 0 0 / 0.85), 0 4px 12px -4px rgb(0 0 0 / 0.5)',
        glow: '0 0 0 1px rgb(var(--primary) / 0.22), 0 14px 50px -14px rgb(var(--primary) / 0.5)',
        'glow-soft': '0 0 90px -30px rgb(var(--primary) / 0.55)',
        'glow-accent': '0 0 0 1px rgb(var(--accent) / 0.18), 0 14px 50px -14px rgb(var(--accent) / 0.45)',
      },
      backgroundImage: {
        'grid-light': 'linear-gradient(to right, rgb(20 20 24 / 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgb(20 20 24 / 0.05) 1px, transparent 1px)',
        'grid-dark': 'linear-gradient(to right, rgb(255 255 255 / 0.045) 1px, transparent 1px), linear-gradient(to bottom, rgb(255 255 255 / 0.045) 1px, transparent 1px)',
        'radial-fade': 'radial-gradient(ellipse 80% 65% at 50% -10%, rgb(var(--primary) / 0.13), transparent 62%)',
        mesh: 'radial-gradient(120% 120% at 0% 0%, rgb(var(--primary) / 0.16), transparent 42%), radial-gradient(120% 120% at 100% 100%, rgb(var(--accent) / 0.12), transparent 46%)',
        'mesh-hot': 'radial-gradient(120% 120% at 100% 0%, rgb(var(--hot) / 0.18), transparent 44%), radial-gradient(120% 120% at 0% 100%, rgb(var(--primary) / 0.14), transparent 46%)',
        'mesh-top': 'radial-gradient(120% 120% at 50% 0%, rgb(var(--primary) / 0.16), transparent 50%)',
      },
      backgroundSize: {
        grid: '32px 32px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--success) / 0.5)' },
          '70%': { boxShadow: '0 0 0 14px rgb(var(--success) / 0)' },
          '100%': { boxShadow: '0 0 0 0 rgb(var(--success) / 0)' },
        },
        'live-pulse': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.35', transform: 'scale(0.8)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'fade-up': 'fade-up 0.55s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'pulse-ring': 'pulse-ring 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'live-pulse': 'live-pulse 1.6s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        marquee: 'marquee 40s linear infinite',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}