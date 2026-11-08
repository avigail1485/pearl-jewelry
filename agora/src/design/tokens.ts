// AGORA design tokens — the single source of truth (see design-handoff/tokens).
export const colors = {
  ink: "#1E1E1E",
  neon: "#92FF5F",
  white: "#FFFFFF",
  "gray-100": "#F6F6F6",
  "green-100": "#CFFFB0",
  placeholder: "#9C9E9C",
} as const;

// Type scale — nothing above 24.
export const fontSize: Record<string, [string, { lineHeight: string }]> = {
  nav: ["12px", { lineHeight: "16px" }],
  meta: ["13px", { lineHeight: "18px" }],
  body: ["14px", { lineHeight: "1.5" }],
  button: ["16px", { lineHeight: "20px" }],
  title: ["20px", { lineHeight: "26px" }],
  section: ["24px", { lineHeight: "30px" }],
};

export const shadows = {
  card: "0 2px 8px rgba(30,30,30,.12)",
  nav: "0 -2px 10px rgba(30,30,30,.08)",
};

// Buttons: large (48px tall, search bar) 16px corners; small (≤44px: chips, icon buttons) 8px.
export const radii = { search: "8px", tile: "16px", btn: "16px", "btn-sm": "8px", sheet: "28px" };
