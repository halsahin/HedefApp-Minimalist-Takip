export const LightColors = {
    bg: '#F4F4F6',
    surface: '#FFFFFF',
    surface2: '#F9F9FB',
    border: '#E4E4EA',
    borderSoft: '#EEEEEF',

    text: '#1A1A2E',
    textMuted: '#7A7A9A',
    textLight: '#ADADC8',

    accent: '#06B6D4',
    accentDark: '#0891B2',
    accentBg: '#ECFEFF',
    accentGlow: 'rgba(6,182,212,0.25)',

    danger: '#FF6B6B',
    dangerSoft: '#FFF0F0',
    success: '#62C87A',
    successSoft: '#F0FBF3',

    pinned: '#FFF5C2',
    pinnedBorder: '#E8D870',
};

export const DarkColors = {
    bg: '#000000',
    surface: '#222222',
    surface2: '#2A2A2A',
    border: '#444444',
    borderSoft: '#333333',

    text: '#CCCCCC',
    textMuted: '#999999',
    textLight: '#777777',

    accent: '#888888',
    accentDark: '#666666',
    accentBg: '#333333',
    accentGlow: 'rgba(136,136,136,0.15)',

    danger: '#FF7A7A',
    dangerSoft: '#2A1515',
    success: '#5DBF72',
    successSoft: '#142014',

    pinned: '#2A2410',
    pinnedBorder: '#6A5E20',
};

// Backward-compat alias — components still import Colors from theme.js
export const Colors = LightColors;

export const Typography = {
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
