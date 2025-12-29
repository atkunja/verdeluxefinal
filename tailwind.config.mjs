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
          DEFAULT: "#163022",
          dark: "#0d1f16",
          light: "#EDEAE1",
        },
        gray: {
          bg: "#f6f3f2",
          text: "#7d8393",
        },
      },
      animation: {
        "float": "float 6s ease-in-out infinite",
        "float-delayed": "float 6s ease-in-out 3s infinite",
        "fade-in-up": "fadeInUp 0.8s ease-out forwards",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
};
