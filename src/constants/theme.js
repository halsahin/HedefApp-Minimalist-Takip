// ──────────────────────────────────────────────
// Theme — mirrors the CSS custom properties
// from the web app 1:1
// ──────────────────────────────────────────────

export const Colors = {
    bg: '#F4F4F6',
    surface: '#FFFFFF',
    surface2: '#F9F9FB',
    border: '#E4E4EA',
    borderSoft: '#EEEEEF',

    text: '#1A1A2E',
    textMuted: '#7A7A9A',
    textLight: '#ADADC8',

    accent: '#F9E55A',
    accentDark: '#E0C828',
    accentBg: '#FFFCE8',
    accentGlow: 'rgba(249,229,90,0.25)',

    danger: '#FF6B6B',
    dangerSoft: '#FFF0F0',
    success: '#62C87A',
    successSoft: '#F0FBF3',

    pinned: '#FFF5C2',
    pinnedBorder: '#E8D870',
};

export const Typography = {
    // Inter is loaded via expo-font; fallback to system sans-serif
    fontFamily: 'Inter_400Regular',
    fontFamilyMedium: 'Inter_500Medium',
    fontFamilySemiBold: 'Inter_600SemiBold',
    fontFamilyBold: 'Inter_700Bold',

    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
};

export const Radii = {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
};

export const Shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.09,
        shadowRadius: 16,
        elevation: 4,
    },
};
