import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Text. Deep green-black rather than pure black: it sits better on ivory.
        ink: {
          DEFAULT: '#10231f',
          soft: '#1d3530',
          muted: '#5a6b66',
          faint: '#8a9893',
        },
        // Page, panels and hairlines.
        surface: {
          DEFAULT: '#ffffff',
          sunken: '#f6f3ec',
          subtle: '#efebe2',
          border: '#e4dfd2',
        },
        // Dark chrome: header, hero, footer.
        forest: {
          DEFAULT: '#08241f',
          raised: '#0e332c',
          line: '#1f4a41',
          text: '#c9dcd6',
        },
        brand: {
          DEFAULT: '#0b6b57',
          strong: '#08574a',
          soft: '#e4f1ec',
        },
        // Gold is used sparingly: key numbers, highlights, the one thing to look at.
        gold: {
          DEFAULT: '#b8862b',
          bright: '#e0b45a',
          soft: '#faf2de',
        },
        good: { DEFAULT: '#0f7a4f', soft: '#e6f4ec' },
        warn: { DEFAULT: '#a15c07', soft: '#fcf1dc' },
        bad: { DEFAULT: '#b42318', soft: '#fdecea' },
      },
      fontFamily: {
        sans: ['Inter Variable', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Fraunces Variable', 'ui-serif', 'Georgia', 'serif'],
        mono: ['JetBrains Mono Variable', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 35, 31, 0.04), 0 4px 16px -6px rgba(16, 35, 31, 0.08)',
        lift: '0 2px 4px rgba(16, 35, 31, 0.05), 0 16px 32px -12px rgba(16, 35, 31, 0.18)',
        glow: '0 0 0 1px rgba(224, 180, 90, 0.25), 0 24px 60px -20px rgba(0, 0, 0, 0.55)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
