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
        },
        surface: {
          base: '#000000',
          card: '#1a1a1a',
          cardHover: '#222222',
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
      },
      boxShadow: {
        'inset-white': 'inset 0px 0px 0px 1px rgba(255, 255, 255, 0.12)',
        'card-subtle': '0 4px 20px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [],
};

export default config;
