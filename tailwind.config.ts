import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: "#D4AF37",
          charcoal: "#111111",
          slate: "#1E293B",
          mist: "#F8F5EC",
        },
      },
      boxShadow: {
        glow: "0 18px 50px rgba(212, 175, 55, 0.18)",
      },
      backgroundImage: {
        "gold-grid":
          "radial-gradient(circle at 1px 1px, rgba(212,175,55,0.15) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
