export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        homa: {
          red: '#D10000',
          'red-dark': '#A80000',
          'red-light': '#F5E0E0',
          white: '#FFFFFF',
          grey: '#7F7F7F',
          black: '#292828',
          cream: '#F9F5F2',
          blush: '#F5EEE9',
          pink: '#F9EDE8',
          dark: '#1A0000',
        },
        brand: {
          DEFAULT: '#292828',
          red: '#D10000',
          cream: '#F9F5F2',
          blush: '#F5EEE9',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        heading: ['"Playfair Display"', 'Georgia', 'serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      letterSpacing: {
        'widest-2': '0.2em',
        'widest-3': '0.3em',
      },
      backgroundImage: {
        'homa-gradient': 'linear-gradient(135deg, #D10000 0%, #A80000 100%)',
      },
    },
  },
  plugins: [],
}
