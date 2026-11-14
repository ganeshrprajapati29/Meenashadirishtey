/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        maroon: { 50: '#FDF3F3', 100: '#FBE4E4', 200: '#F5C5C5', 300: '#E89A9A', 400: '#D06565', 500: '#B33D3D', 600: '#962A2A', 700: '#7A1F1F', 800: '#5E1818', 900: '#451111' },
        gold: { 50: '#FEFAEC', 100: '#FCF1C9', 200: '#F8E08F', 300: '#F5C542', 400: '#E8B422', 500: '#D4A017', 600: '#AE7D10', 700: '#8A5E10', 800: '#714B14', 900: '#5F3F15' },
        saffron: { 400: '#F08C45', 500: '#E8762C', 600: '#C95D1A' },
        cream: '#FFF8EC',
        ink: '#2B1A14',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Poppins', '"Noto Sans Devanagari"', 'system-ui', 'sans-serif'],
        hindi: ['"Noto Sans Devanagari"', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -6px rgba(122, 31, 31, 0.15)',
        glow: '0 10px 40px -10px rgba(212, 160, 23, 0.55)',
      },
      backgroundImage: {
        'royal': 'linear-gradient(135deg, #451111 0%, #7A1F1F 45%, #9A3412 100%)',
        'gold-shine': 'linear-gradient(135deg, #F5C542 0%, #D4A017 50%, #AE7D10 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        swing: { '0%,100%': { transform: 'rotate(-3deg)' }, '50%': { transform: 'rotate(3deg)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'fade-up': 'fadeUp .6s ease-out both',
        swing: 'swing 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
