/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#C8960C',
        'primary-dark': '#8B6508',
        secondary: '#2D6A4F',
        accent: '#D62828',
        'bg-page': '#FAFAF7',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B7280',
        border: '#E5E7EB',
        'status-offline': '#F59E0B',
        'status-syncing': '#3B82F6',
        'status-synced': '#10B981',
        'status-error': '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
