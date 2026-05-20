module.exports = {
  purge: [],
  purge: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        primary: "#152A5A",
      },
      container: {
        center: true,
        padding: {
          DEFAULT: "1rem",
          sm: "2rem",
          md: "2rem",
          lg: "2rem",
          xl: "2rem",
          "2xl": "2rem",
        },
      },
      screens: {
        "small-mobile": "430px",
        // => @media (min-width: 320px) { ... }

        mobile: "576px",
        // => @media (min-width: 480px) { ... }

        tablet: "786px",
        // => @media (min-width: 640px) { ... }

        laptop: "992px",
        // => @media (min-width: 1024px) { ... }

        desktop: "1200px",
        // => @media (min-width: 1280px) { ... }

        "large-desktop": "1400px",
        // => @media (min-width: 1600px) { ... }
      },
      // colors: {
      //   primary: "#DB4444",
      //   secondary: "#6c757d",
      //   success: "#28a745",
      //   danger: "#dc3545",
      //   warning: "#ffc107",
      //   info: "#17a2b8",
      //   light: "#f8f9fa",
      //   dark: "#343a40",
      // },

      // fontFamily: {
      //   poppins: ['Poppins', 'sans-serif'],

      // },
      screens: {
        "2xl": { max: "1535px" },
      },
    },
  },
  variants: {
    extend: {},
  },

};
