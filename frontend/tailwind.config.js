/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discipline1: 'var(--discipline-1)',
        discipline2: 'var(--discipline-2)',
        discipline3: 'var(--discipline-3)',
        discipline4: 'var(--discipline-4)',
        discipline5: 'var(--discipline-5)',
      },
    },
  },
  plugins: [],
};
