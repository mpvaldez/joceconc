/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Libre Franklin', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Cormorant Garamond', 'ui-serif', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          primary: '#0b0b0b',
          secondary: '#171717',
          accent: '#262626',
          highlight: '#cfcfcf',
          ink: '#f3f3f3',
          ivory: '#ffffff',
        },
      },
      backgroundImage: {
        'brand-atmosphere':
          'linear-gradient(180deg, #121212 0%, #080808 100%)',
        'brand-card': 'linear-gradient(180deg, #1a1a1a 0%, #101010 100%)',
        'brand-cta': 'linear-gradient(110deg, #262626 0%, #101010 100%)',
      },
      boxShadow: {
        'brand-card': '0 16px 38px rgba(0, 0, 0, 0.45)',
        'brand-cta': '0 12px 30px rgba(0, 0, 0, 0.25)',
      },
      keyframes: {
        rise: {
          from: {
            opacity: '0',
            transform: 'translateY(16px)',
          },
          to: {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        rise: 'rise 600ms ease both',
      },
    },
  },
  plugins: [],
}

