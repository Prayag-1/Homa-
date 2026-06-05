export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1A1410',
          red:     '#C8432B',
          cream:   '#F5F0EA',
          blush:   '#E8CDBF',
          white:   '#FDFAF7',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
      }
    }
  },
  plugins: []
}
