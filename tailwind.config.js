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
        groww: {
          primary: '#00B386',
          'primary-dark': '#009B75',
          'primary-light': '#E8F8F3',
          'primary-subtle': '#F3FBF8',
          positive: '#00A878',
          'positive-bg': '#EAF8F3',
          negative: '#EB5757',
          'negative-bg': '#FDECEC',
          warning: '#F59E0B',
          'warning-bg': '#FFF7E6',
          info: '#3B82F6',
          'info-bg': '#EFF6FF',
          bg: '#FFFFFF',
          surface: '#FFFFFF',
          'surface-secondary': '#F8F9FA',
          'surface-tertiary': '#F3F4F6',
          border: '#E5E7EB',
          'border-light': '#F0F1F2',
          text: '#1F2937',
          'text-secondary': '#6B7280',
          'text-tertiary': '#9CA3AF',
          'text-disabled': '#D1D5DB',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'groww-sm': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'groww-md': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'groww-lg': '0 8px 24px rgba(0, 0, 0, 0.08)',
      },
      borderRadius: {
        'groww-sm': '6px',
        'groww-md': '10px',
        'groww-lg': '14px',
        'groww-xl': '18px',
      },
    },
  },
  plugins: [],
}
