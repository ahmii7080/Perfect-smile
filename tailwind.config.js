/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        // Scheme A — Pure Clinical
        brand: {
          50:  "#F0F9FF",
          100: "#E0F2FE",
          200: "#BAE6FD",
          300: "#7DD3FC",
          400: "#38BDF8",
          500: "#0EA5E9", // primary sky blue
          600: "#0284C7",
          700: "#0369A1",
          800: "#075985",
          900: "#0C4A6E",
          950: "#082F49"
        },
        mint: {
          50:  "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6", // accent mint
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A"
        },
        ink: {
          DEFAULT: "#0F172A",
          soft: "#1E293B",
          muted: "#64748B"
        },
        cream: "#F8FAFC",
        warm:  "#F1F5F9",
        gold:  "#B58A2E"
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans:  ['Manrope', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        soft:    "0 10px 30px -12px rgba(14, 165, 233, 0.22)",
        card:    "0 8px 24px -10px rgba(15, 23, 42, 0.10)",
        lift:    "0 22px 40px -18px rgba(15, 23, 42, 0.18)"
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
