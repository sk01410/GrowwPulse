/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefdf6',
          100: '#d5fae8',
          200: '#aef4d4',
          300: '#75eab8',
          400: '#38d795',
          500: '#00d09c', // Groww primary green
          600: '#00a87c',
          700: '#008363',
          800: '#03674f',
          900: '#045542',
          950: '#013026',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
        },
        pulse: {
          high: '#ef4444',
          important: '#f59e0b',
          watch: '#3b82f6',
          normal: '#64748b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
