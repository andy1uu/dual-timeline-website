/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx,mdx,html,css}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        rubik: ["var(--font-rubik)", ...fontFamily.sans]
      },
      colors: { dark: "#1b1b1b", light: "#f5f5f5", primary: "#33b679" }
    },
  },
  plugins: []
};
