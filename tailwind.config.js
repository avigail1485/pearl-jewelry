/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bone: '#f4f1ea',
        ink: '#17160f',
        clay: '#8a6a4f',
        brass: '#a9762f',
        line: '#d9d3c4',
      },
      fontFamily: {
        display: ['"Tel Aviv Brutalist"', 'sans-serif'],
        body: ['"Open Sans"', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
    },
  },
  plugins: [],
}
