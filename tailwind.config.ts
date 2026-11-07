import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cream: "#FFF8F5",
        strawberry: {
          50: "#FFF5F8",
          100: "#FFE4EC",
          200: "#FFC2D4",
          300: "#FF9ABA",
          400: "#F86B9A",
          500: "#E84A7F",
          600: "#D1326A",
          700: "#B01F55",
          800: "#8F1845",
          900: "#6F1437",
        },
        matcha: {
          50: "#F5FAF1",
          100: "#E7F2DE",
          200: "#CFE5BE",
          300: "#B4D49B",
          400: "#97C07A",
          500: "#7A9B6D",
          600: "#5F7F55",
          700: "#4A6443",
          800: "#3A4F35",
          900: "#2C3C29",
        },
        ink: {
          50: "#F7F5F6",
          100: "#EDE8EA",
          200: "#D9D0D4",
          300: "#B9ADB3",
          400: "#8F8088",
          500: "#6E6068",
          600: "#574B52",
          700: "#463C42",
          800: "#322B2F",
          900: "#1F1A1C",
        },
      },
      boxShadow: {
        soft: "0 10px 30px rgba(232, 74, 127, 0.12)",
        card: "0 18px 50px rgba(49, 38, 44, 0.06)",
        lift: "0 22px 60px rgba(49, 38, 44, 0.10)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.45s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
