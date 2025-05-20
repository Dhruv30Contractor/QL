// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".no-scrollbar": {
          /* For Chrome, Safari and Opera */
          "&::-webkit-scrollbar": {
            display: "none",
          },
          /* For IE, Edge and Firefox */
          "-ms-overflow-style": "none", // IE and Edge
          "scrollbar-width": "none",    // Firefox
        },
      });
    },
  ],
};
