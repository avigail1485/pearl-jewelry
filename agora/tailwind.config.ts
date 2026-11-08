import type { Config } from "tailwindcss";
import { colors, fontSize, shadows, radii } from "./src/design/tokens";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // Replace (not extend) so only the design-system palette exists.
    colors: { transparent: "transparent", current: "currentColor", ...colors },
    fontFamily: { sans: ['"Gloria"', "system-ui", "sans-serif"] },
    fontWeight: { light: "300", demibold: "600" },
    fontSize,
    boxShadow: { none: "none", ...shadows },
    extend: {
      borderRadius: radii,
      spacing: { gutter: "24px", nav: "75px" },
      maxWidth: { app: "480px" },
    },
  },
  plugins: [],
} satisfies Config;
