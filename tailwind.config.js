/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        adaptive: {
          50:  '#EBF2FA',
          100: '#D6E4F5',
          200: '#ADC9EB',
          300: '#85AEE0',
          400: '#5C93D6',
          500: '#4A7FC4',
          600: '#3B6BA8',
          700: '#2D5A8E',
          800: '#1E3A5F',
          900: '#142840',
        },
      },
    },
  },
  plugins: [],
}
