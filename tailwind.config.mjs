/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "sans-serif"],
        serif: ["Roboto Slab", "serif"],
        heading: ["Roboto Slab", "serif"],
        body: ["Roboto", "sans-serif"],
        opensans: ["Open Sans", "sans-serif"],
      },
      colors: {
        primary: {
          DEFAULT: "#5e870d",
          dark: "#3d550c",
        },
        gray: {
          bg: "#f6f3f2",
          text: "#7d8393",
        },
      },
    },
  },
};
