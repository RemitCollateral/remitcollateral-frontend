import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0b1220',
          soft: '#1a2436',
          muted: '#64748b',
        },
        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f6f8fb',
          border: '#e2e8f0',
        },
        brand: {
          DEFAULT: '#1d4ed8',
          soft: '#eff4ff',
        },
        good: { DEFAULT: '#047857', soft: '#ecfdf5' },
        warn: { DEFAULT: '#b45309', soft: '#fffbeb' },
        bad: { DEFAULT: '#b91c1c', soft: '#fef2f2' },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
