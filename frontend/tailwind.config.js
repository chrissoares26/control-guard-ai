/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1E3A5F',
          dark: '#172E4C',
          light: '#2A4F7C',
          muted: '#4A6FA5',
        },
        surface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        modal: '0 20px 60px -12px rgb(0 0 0 / 0.25), 0 8px 20px -8px rgb(0 0 0 / 0.15)',
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
      }
    }
  },
  plugins: []
}
