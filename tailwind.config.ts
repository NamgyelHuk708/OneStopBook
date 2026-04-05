import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Frost green scale
        g50: "#f2faf7",
        g100: "#9FE1CB",
        g200: "#5DCAA5",
        g400: "#1D9E75",
        g600: "#0F6E56",
        g800: "#085041",
        g900: "#04342C",
        // Semantic status
        warning: {
          DEFAULT: "#BA7517",
          bg: "#FAEEDA",
          text: "#633806",
        },
        danger: {
          DEFAULT: "#E24B4A",
          bg: "#FCEBEB",
        },
        success: {
          DEFAULT: "#1D9E75",
          bg: "#E1F5EE",
        },
      },
      borderRadius: {
        card: "16px",
        pill: "30px",
        input: "10px",
        tag: "20px",
      },
      borderWidth: {
        thin: "0.5px",
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "sans-serif"],
      },
      letterSpacing: {
        heading: "-0.4px",
        label: "0.3px",
      },
      lineHeight: {
        body: "1.65",
      },
    },
  },
  plugins: [],
};
export default config;
