import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './providers/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: '#111827',
        'background-light': '#FAFAFA',
        'background-dark': '#111111',
        palette: {
          darkest: '#18181B',
          mediumDark: '#71717A',
          mediumLight: '#E4E4E7',
          lightest: '#FAFAFA',
        },
        win95: {
          bg: '#E4E4E7',
          light: '#FAFAFA',
          shadow: '#D4D4D8',
          dark: '#71717A',
          blue: '#2563eb',
          blueLight: '#60a5fa',
        },
      },
      animation: {
        'in': 'animateIn 0.2s ease-out',
      },
      keyframes: {
        animateIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
