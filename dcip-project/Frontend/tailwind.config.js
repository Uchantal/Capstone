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
          red: '#D62828',
        },
        surface: {
          white: '#FFFFFF',
          warm: '#F9F7F4',
          canvas: '#E8E4DC',
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
        status: {
          offline: '#888888',
          syncing: '#C8960C',
          synced: '#2D6A4F',
          error: '#D62828',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
