/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stripe: {
          bg: "#080b11",
          card: "#0e131f",
          cardElevated: "#141b2c",
          border: "#1a2234",
          borderHover: "#2a3650",
          muted: "#64748b",
          subtle: "#94a3b8",
        },
        cyber: {
          bg: "#080b11",
          card: "#0e131f",
          border: "#1a2234",
          emerald: "#10b981",
          crimson: "#f43f5e",
          cyan: "#06b6d4",
          purple: "#8b5cf6",
          amber: "#f59e0b",
          indigo: "#6366f1"
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.25)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.25)',
        'stripe-card': '0 4px 20px -2px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}

