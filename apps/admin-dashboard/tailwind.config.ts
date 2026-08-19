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
        // Vercel Light Design System Tokens
        gray: {
          50: '#fcfcfc',
          100: '#f7f7f7',
          200: '#ebebeb', // Dividers & 1px border rings
          300: '#e1e1e1',
          400: '#cccccc',
          500: '#b4b4b4',
          600: '#9e9e9e',
          700: '#8f8f8f', // Tertiary / muted
          800: '#666666',
          900: '#4d4d4d', // Secondary text / subheadings
          1000: '#171717', // Primary text / headings
        },
        surface: {
          DEFAULT: '#ffffff', // background-100
          subtle: '#fafafa',  // background-200
          muted: '#f5f5f5',
          border: '#ebebeb',  // Hairline 1px border ring
        },
        brand: {
          black: '#000000',
          white: '#ffffff',
        },
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'GeistMono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      letterSpacing: {
        'display-2xl': '-3.84px',
        'display-xl': '-2.4px',
        'display-lg': '-1.5px',
        'display-md': '-0.96px',
        'display-sm': '-0.5px',
        'tightest': '-0.06em',
      },
      borderRadius: {
        'pill': '9999px',
        'card': '8px',
      },
      boxShadow: {
        'ring-border': '0 0 0 1px #ebebeb',
        'ring-border-hover': '0 0 0 1px #cccccc',
        'ring-focus': '0 0 0 2px #171717',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        }
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.2s ease-out',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        'ping-slow': 'ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
