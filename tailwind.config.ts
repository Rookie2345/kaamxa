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
        primary: {
          DEFAULT: "#1F7A4D",
          hover: "#18633e",
          dark: "#144f31",
          light: "#e8f5ee",
        },
        accent: {
          DEFAULT: "#F28C28",
          hover: "#da7517",
          dark: "#c2630d",
          light: "#fef3e7",
        },
        brand: {
          bg: "#FAFAF7",
          text: "#1C1C1C",
          muted: "#666666",
          border: "#E5E5E0",
          card: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-noto-sans-devanagari)", "system-ui", "sans-serif"],
      },
      screens: {
        xs: "420px",
      },
    },
  },
  plugins: [],
};

export default config;
