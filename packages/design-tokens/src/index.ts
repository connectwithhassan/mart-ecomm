/**
 * Design Tokens generated via ui-ux-pro-max intelligence
 * Storefront: Feature-Rich Showcase, Vibrant & Block-based
 * Portals: Real-Time / Operations, Density 8/10
 */

export const storefrontTokens = {
  colors: {
    primary: '#059669',
    onPrimary: '#FFFFFF',
    secondary: '#10B981',
    onSecondary: '#0F172A',
    accent: '#EA580C',
    onAccent: '#FFFFFF',
    background: '#F8FAFC',
    foreground: '#0F172A',
    card: '#FFFFFF',
    cardForeground: '#0F172A',
    muted: '#F1F5F9',
    mutedForeground: '#64748B',
    border: '#E2E8F0',
    destructive: '#DC2626',
    ring: '#059669',
  },
  typography: {
    fontHeading: "'Rubik', sans-serif",
    fontBody: "'Nunito Sans', sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Rubik:wght@400;500;600;700&display=swap',
  },
} as const;

export const portalTokens = {
  colors: {
    primary: '#1E293B',
    onPrimary: '#FFFFFF',
    secondary: '#334155',
    onSecondary: '#FFFFFF',
    accent: '#22C55E',
    onAccent: '#0F172A',
    background: '#0F172A',
    foreground: '#F8FAFC',
    card: '#1B2336',
    cardForeground: '#F8FAFC',
    muted: '#272F42',
    mutedForeground: '#94A3B8',
    border: '#334155',
    destructive: '#EF4444',
    ring: '#22C55E',
  },
  typography: {
    fontHeading: "'Fira Code', monospace",
    fontBody: "'Fira Sans', sans-serif",
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap',
  },
  density: {
    spacingMultiplier: 0.8, // 8/10 density dial
    tablePaddingY: '0.625rem', // 10px
    tablePaddingX: '0.75rem', // 12px
    buttonHeightSm: '2rem', // 32px
  },
} as const;

export const iconsConfig = {
  preferredFamily: '@phosphor-icons/react',
  fallbackFamily: '@heroicons/react',
  standardStrokeWidth: 1.5,
  touchTargetMinWeb: 44, // 44px accessible touch target
} as const;
