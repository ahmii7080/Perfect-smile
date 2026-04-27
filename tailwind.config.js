/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#EFF9FE",
          100: "#D9F0FB",
          200: "#A8DEF5",
          300: "#6FC6EC",
          400: "#3DAEE0",
          500: "#1597D5", // primary bright blue
          600: "#0F7AB0",
          700: "#0C608B",
          800: "#0A4A6B",
          900: "#0A3A55",
          950: "#062A40"
        },
        ink: {
          DEFAULT: "#0F1A2A",
          soft: "#1F2A3D",
          muted: "#566379"
        },
        cream: "#FAFAF7",
        warm:  "#F4F8FB",
        gold:  "#BA7517"
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Manrope', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft:    "0 10px 30px -12px rgba(15, 122, 176, 0.18)",
        card:    "0 8px 24px -10px rgba(10, 58, 85, 0.18)",
        lift:    "0 22px 40px -18px rgba(10, 58, 85, 0.28)"
      },
      borderRadius: {
        "4xl": "2rem"
      },
      keyframes: {
        pulseRing: {
          "0%":   { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0"   }
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-10px)" }
        }
      },
      animation: {
        pulseRing: "pulseRing 1.6s ease-out infinite",
        floaty:    "floaty 6s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
