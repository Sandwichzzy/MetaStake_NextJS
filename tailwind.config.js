/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "cyber-cyan": "#00FFFF",
        "cyber-purple": "#A855F7",
        "cyber-pink": "#EC4899",
        "cyber-green": "#22C55E",
      },
      animation: {
        "grid-move": "grid-move 20s linear infinite",
        "particles-float": "particles-float 30s linear infinite",
        "cyber-pulse": "cyber-pulse 2s ease-in-out infinite",
        "status-blink": "status-blink 2s ease-in-out infinite",
        "border-glow": "border-glow 3s ease-in-out infinite",
      },
      keyframes: {
        "grid-move": {
          "0%": { transform: "translate(0, 0)" },
          "100%": { transform: "translate(50px, 50px)" },
        },
        "particles-float": {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "cyber-pulse": {
          "0%, 100%": { opacity: "0.8" },
          "50%": { opacity: "1" },
        },
        "status-blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "border-glow": {
          "0%": { borderColor: "rgba(0, 255, 255, 0.3)" },
          "50%": { borderColor: "rgba(0, 255, 255, 0.8)" },
          "100%": { borderColor: "rgba(0, 255, 255, 0.3)" },
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "Liberation Mono",
          "Courier New",
          "monospace",
        ],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
