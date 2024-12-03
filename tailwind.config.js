/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        primary: '#1D4ED8',
        secondaryText: '#ABB7C0',
        accent: '#F59E0B',
        primaryBg: '#191E22',
        secondaryBg: '#20272D',
        surface: '#FFFFFF',
        error: '#DC2626',
        yellow: '#FCCA40',
        inputBg: '#14191E',
        'secondary-heiglight': '#4A5863'
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        Barlow: ['Barlow']
      },
      borderColor: {
        primary: '#1D2428',
        secondary: '#293237',
        'custom-border': '#272F34',
        'custom-secondary': '#4A5863'
      },
      boxShadow: {
        'custom-black': '0px 2px 1px 0px rgba(0, 0, 0, 0.5)', // #00000080 in RGBA
      },
    },
  },
  plugins: [],
}

