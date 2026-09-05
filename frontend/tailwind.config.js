/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#FDFBF7",
        earth: {
          900: "#451A03", // deep earth brown
          800: "#78350F", // terracotta brown
          700: "#92400E",
          600: "#B45309",
        },
        amber: {
          accent: "#D97706",
          soft: "#F59E0B",
        },
        terracotta: "#C2410C",
      },
      fontFamily: {
        serif: ["'Playfair Display'", "Georgia", "serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 24px -4px rgba(69, 26, 3, 0.15)",
      },
    },
  },
  plugins: [],
};
