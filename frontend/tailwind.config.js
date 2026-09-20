export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F7F3EC",
        sand: "#E6DCC8",
        sage: {
          DEFAULT: "#5B7A6A",
          deep: "#1F3A34",
          mist: "#EEF4F0",
          leaf: "#7C9A88",
        },
        clay: "#C46B4A",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Outfit", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px -24px rgba(31, 58, 52, 0.35)",
      },
    },
  },
  plugins: [],
};
