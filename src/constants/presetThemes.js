/**
 * Preset themes for HedefApp.
 * Each preset defines accent colors that override the base Light/Dark palette.
 * Structure: { id, nameKey, emoji, light: { accent, accentDark, accentBg, accentGlow }, dark: { ... } }
 */
export const PRESET_THEMES = [
    {
        id: 'default',
        nameKey: 'customTheme.presetDefault',
        icon: 'star',
        light: {
            accent: '#06B6D4',
            accentDark: '#0891B2',
            accentBg: '#ECFEFF',
            accentGlow: 'rgba(6,182,212,0.25)',
        },
        dark: {
            accent: '#888888',
            accentDark: '#666666',
            accentBg: '#333333',
            accentGlow: 'rgba(136,136,136,0.15)',
        },
    },
    {
        id: 'ocean',
        nameKey: 'customTheme.presetOcean',
        icon: 'droplet',
        light: {
            accent: '#64D8FF',
            accentDark: '#0099CC',
            accentBg: '#E8F8FF',
            accentGlow: 'rgba(100,216,255,0.25)',
        },
        dark: {
            accent: '#64D8FF',
            accentDark: '#33BBEE',
            accentBg: '#091A22',
            accentGlow: 'rgba(100,216,255,0.15)',
        },
    },
    {
        id: 'rose',
        nameKey: 'customTheme.presetRose',
        icon: 'heart',
        light: {
            accent: '#FF85A1',
            accentDark: '#E84466',
            accentBg: '#FFF0F4',
            accentGlow: 'rgba(255,133,161,0.25)',
        },
        dark: {
            accent: '#FF85A1',
            accentDark: '#FF6B8E',
            accentBg: '#220A10',
            accentGlow: 'rgba(255,133,161,0.15)',
        },
    },
    {
        id: 'mint',
        nameKey: 'customTheme.presetMint',
        icon: 'feather',
        light: {
            accent: '#4ECEA3',
            accentDark: '#28A87E',
            accentBg: '#EAFAF4',
            accentGlow: 'rgba(78,206,163,0.25)',
        },
        dark: {
            accent: '#4ECEA3',
            accentDark: '#3DB88D',
            accentBg: '#0A2018',
            accentGlow: 'rgba(78,206,163,0.15)',
        },
    },
    {
        id: 'lavender',
        nameKey: 'customTheme.presetLavender',
        icon: 'moon',
        light: {
            accent: '#B197FC',
            accentDark: '#7C4DFF',
            accentBg: '#F2EEFF',
            accentGlow: 'rgba(177,151,252,0.25)',
        },
        dark: {
            accent: '#B197FC',
            accentDark: '#9A7AF8',
            accentBg: '#130E22',
            accentGlow: 'rgba(177,151,252,0.15)',
        },
    },
    {
        id: 'peach',
        nameKey: 'customTheme.presetPeach',
        icon: 'sun',
        light: {
            accent: '#FFA07A',
            accentDark: '#E8682A',
            accentBg: '#FFF3EE',
            accentGlow: 'rgba(255,160,122,0.25)',
        },
        dark: {
            accent: '#FFA07A',
            accentDark: '#FF8A55',
            accentBg: '#221108',
            accentGlow: 'rgba(255,160,122,0.15)',
        },
    },
    {
        id: 'sky',
        nameKey: 'customTheme.presetSky',
        icon: 'cloud',
        light: {
            accent: '#74C0FC',
            accentDark: '#339AF0',
            accentBg: '#EEF7FF',
            accentGlow: 'rgba(116,192,252,0.25)',
        },
        dark: {
            accent: '#74C0FC',
            accentDark: '#4DABF7',
            accentBg: '#091520',
            accentGlow: 'rgba(116,192,252,0.15)',
        },
    },
    {
        id: 'gold',
        nameKey: 'customTheme.presetGold',
        icon: 'award',
        light: {
            accent: '#F9E55A',
            accentDark: '#E6B800',
            accentBg: '#FFFDF0',
            accentGlow: 'rgba(249,229,90,0.3)',
        },
        dark: {
            accent: '#FFD700',
            accentDark: '#E6B800',
            accentBg: '#1F1800',
            accentGlow: 'rgba(255,215,0,0.15)',
        },
    },
];

/**
 * Build a color overrides object from a custom hex color.
 * Generates accent, accentDark, accentBg, accentGlow for light & dark.
 */
export function buildCustomAccent(hex) {
    // Lighten for accentDark (slightly darker), accentBg (very light tint)
    return {
        light: {
            accent: hex,
            accentDark: darken(hex, 0.18),
            accentBg: lighten(hex, 0.88),
            accentGlow: hexToRgba(hex, 0.25),
        },
        dark: {
            accent: hex,
            accentDark: lighten(hex, 0.15),
            accentBg: darken(hex, 0.78),
            accentGlow: hexToRgba(hex, 0.15),
        },
    };
}

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const bigint = parseInt(clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r},${g},${b},${alpha})`;
}

function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

function darken(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return `#${[r, g, b].map(c => clamp(c * (1 - amount)).toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex, amount) {
    const { r, g, b } = hexToRgb(hex);
    return `#${[r, g, b].map(c => clamp(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('')}`;
}
