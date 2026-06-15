/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#C8960C',
          dark: '#8B6508',
          light: '#FEF3D0',
        },
        secondary: '#2D6A4F',
        accent: {
          DEFAULT: '#D62828',
          green: '#2D6A4F',
          red: '#D62828',
          blue: '#378ADD',
        },
        surface: {
          white: '#FFFFFF',
          warm: '#F9F7F4',
          border: '#E8E4DC',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#555555',
          muted: '#888888',
        },
        dark: {
          base: '#0E1117',
          mid: '#161B25',
          footer: '#080A0E',
        },
        'bg-page': '#FFFFFF',
        'bg-card': '#FFFFFF',
        'text-primary': '#1A1A1A',
        'text-secondary': '#555555',
        border: '#E8E4DC',
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
