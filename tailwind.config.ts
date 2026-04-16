import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        hull: "#07111f",
        void: "#02050c",
        starlight: "#7ce2ff",
        ember: "#ffd27d",
        aurora: "#8cf5d0",
        alert: "#ff8a8a"
      },
      boxShadow: {
        glow: "0 0 40px rgba(124, 226, 255, 0.18)"
      },
      keyframes: {
        drift: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.08)" }
        }
      },
      animation: {
        drift: "drift 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2.8s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
