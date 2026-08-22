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
        brand: {
          green: '#3ecf8e',
          'dark-green': '#006239',
          'light-green': '#3fcf8e',
          black: '#000000',
          white: '#ffffff',
        },
        surface: {
          base: '#000000',
          card: '#1a1a1a',
          cardHover: '#222222',
          DEFAULT: '#1a1a1a',
          subtle: '#141414',
          muted: '#1f1f1f',
          border: '#2e2e2e',
        },
        foreground: {
          DEFAULT: '#ffffff',
          white: '#ffffff',
          muted: '#a0a0a0',
          secondary: '#525252',
        },
        purple: {
          accent: '#bda4ff',
        },
        status: {
          success: '#3ecf8e',
          warning: '#f59e0b',
          danger: '#ef4444',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Source Code Pro', 'ui-monospace', 'Menlo', 'monospace'],
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        base: '8px',
        lg: '11px',
        xl: '12px',
        '2xl': '16px',
        card: '12px',
        pill: '8px',
      },
      boxShadow: {
        'ring-border': '0 0 0 1px #2e2e2e',
        'ring-border-hover': '0 0 0 1px #3ecf8e',
        'ring-focus': '0 0 0 2px #3ecf8e',
        'card-subtle': '0 4px 20px rgba(0, 0, 0, 0.5)',
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
