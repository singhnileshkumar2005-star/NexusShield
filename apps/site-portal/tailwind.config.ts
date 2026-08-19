import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: {
          100: '#ffffff',
          200: '#fafafa',
          300: '#f5f5f5',
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#ebebeb',
          300: '#e0e0e0',
          400: '#cccccc',
          500: '#a3a3a3',
          600: '#737373',
          700: '#8f8f8f',
          800: '#666666',
          900: '#4d4d4d',
          1000: '#171717',
        },
        border: '#ebebeb',
        ring: '#ebebeb',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        DEFAULT: '6px',
        md: '8px',
        lg: '8px',
        xl: '12px',
        '2xl': '16px',
        full: '9999px',
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.02em',
        tight: '-0.01em',
      },
      boxShadow: {
        ring: '0 0 0 1px #ebebeb',
        'ring-subtle': '0 0 0 1px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
