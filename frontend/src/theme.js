// Design tokens - "Dearly" green identity.
// Key names are unchanged from the old theme, so every screen that uses
// these tokens is re-coloured automatically.

export const colors = {
  // Brand
  primary: "#0F7A4B", // Deep green - headers, nav, primary emphasis
  primaryDark: "#0A5C37", // pressed / darker state
  primarySoft: "#DDF3E6", // mint tint for subtle backgrounds / badges

  accent: "#1FA971", // Fresh green - buttons, active states, links
  accentDark: "#148A5B",
  accentSoft: "#DDF3E6", // mint tint

  marigold: "#8FE0B5", // light green - pairs with accent in gradients

  // Surfaces
  background: "#F6FBF8",
  surface: "#FFFFFF",
  border: "#E3EEE7",

  // Text
  textPrimary: "#14261D",
  textSecondary: "#6B7A72",
  textMuted: "#A9B8B0",
  textOnPrimary: "#FFFFFF",

  // Status
  success: "#2ECC71",
  danger: "#D64545",
  dangerSoft: "#FBE9E9",
  warning: "#F2B84B",
};

export const gradients = {
  story: ["#1FA971", "#8FE0B5"],
  header: ["#0F7A4B", "#1FA971"],
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 20,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const shadow = {
  card: {
    shadowColor: "#0F7A4B",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};
