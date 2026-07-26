// Design tokens — "Warm Dusk" identity.
// A deliberate departure from generic social-app blue: a plum/coral palette
// that feels warm and human rather than corporate. Use these tokens instead
// of hardcoded hex values so the whole app stays visually consistent.

export const colors = {
  // Brand
  primary: "#4C3575", // Ink Plum — headers, nav, primary emphasis
  primaryDark: "#332452", // pressed/darker state
  primarySoft: "#EFE9F7", // light plum tint for subtle backgrounds/badges

  accent: "#FF6B4A", // Ember Coral — CTAs, active states, likes, links
  accentDark: "#E85A3C",
  accentSoft: "#FFE7E0", // light coral tint

  marigold: "#FFB648", // secondary accent — pairs with coral in gradients

  // Surfaces
  background: "#FBF6F2", // warm linen app background (not cold gray)
  surface: "#FFFFFF",
  border: "#F0E6DE",

  // Text
  textPrimary: "#2A2035",
  textSecondary: "#8B7F97",
  textMuted: "#B7AEC2",
  textOnPrimary: "#FFFFFF",

  // Status
  success: "#2FAF8A",
  danger: "#E5484D",
  dangerSoft: "#FDE7E7",
  warning: "#FFB648",
};

export const gradients = {
  story: ["#FF6B4A", "#FFB648"], // coral -> marigold, used for story rings
  header: ["#4C3575", "#6B4A9E"], // plum gradient for headers/splash
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
    shadowColor: "#2A2035",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
};
