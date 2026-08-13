import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Map to CSS custom properties for runtime theme switching
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-2": "var(--color-surface-2)",
        elevated: "var(--color-elevated)",
        border: "var(--color-border)",
        "border-soft": "var(--color-border-soft)",
        accent: "var(--color-accent)",
        "accent-dim": "var(--color-accent-dim)",
        text: "var(--color-text)",
        muted: "var(--color-text-muted)",
        subtle: "var(--color-text-subtle)",
        success: "var(--color-success)",
        error: "var(--color-error)",
      },
      fontFamily: {
        heading: ["CabinetGrotesk", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
