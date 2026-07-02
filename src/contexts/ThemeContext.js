import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightColors, DarkColors } from '../constants/theme';
import { PRESET_THEMES, buildCustomAccent } from '../constants/presetThemes';

const STORAGE_KEY = 'app_theme';         // 'light' | 'dark' | 'system'
const PRESET_KEY  = 'app_theme_preset';  // preset id or 'custom'
const CUSTOM_KEY  = 'app_theme_custom';  // hex string for custom accent
const CUSTOM_BG_KEY = 'app_theme_custom_bg';
const CUSTOM_SURFACE_KEY = 'app_theme_custom_surface';
const CUSTOM_TEXT_KEY = 'app_theme_custom_text';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const systemScheme = useColorScheme();
    const [themeMode, setThemeModeState] = useState('system');
    const [presetId, setPresetIdState]   = useState('default');
    const [customHex, setCustomHexState] = useState('#06B6D4');
    const [customBgHex, setCustomBgHexState] = useState('');
    const [customSurfaceHex, setCustomSurfaceHexState] = useState('');
    const [customTextHex, setCustomTextHexState] = useState('');

    useEffect(() => {
        Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(PRESET_KEY),
            AsyncStorage.getItem(CUSTOM_KEY),
            AsyncStorage.getItem(CUSTOM_BG_KEY),
            AsyncStorage.getItem(CUSTOM_SURFACE_KEY),
            AsyncStorage.getItem(CUSTOM_TEXT_KEY),
        ]).then(([savedMode, savedPreset, savedCustom, savedBg, savedSurface, savedText]) => {
            if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
                setThemeModeState(savedMode);
            }
            if (savedPreset) setPresetIdState(savedPreset);
            if (savedCustom) setCustomHexState(savedCustom);
            if (savedBg) setCustomBgHexState(savedBg);
            if (savedSurface) setCustomSurfaceHexState(savedSurface);
            if (savedText) setCustomTextHexState(savedText);
        });
    }, []);

    const setThemeMode = (mode) => {
        setThemeModeState(mode);
        AsyncStorage.setItem(STORAGE_KEY, mode);
    };

    const setPresetId = (id) => {
        setPresetIdState(id);
        AsyncStorage.setItem(PRESET_KEY, id);
    };

    const setCustomHex = (hex) => {
        setCustomHexState(hex);
        AsyncStorage.setItem(CUSTOM_KEY, hex);
    };

    const setCustomBgHex = (hex) => {
        setCustomBgHexState(hex);
        AsyncStorage.setItem(CUSTOM_BG_KEY, hex);
    };

    const setCustomSurfaceHex = (hex) => {
        setCustomSurfaceHexState(hex);
        AsyncStorage.setItem(CUSTOM_SURFACE_KEY, hex);
    };

    const setCustomTextHex = (hex) => {
        setCustomTextHexState(hex);
        AsyncStorage.setItem(CUSTOM_TEXT_KEY, hex);
    };

    const isDark =
        themeMode === 'dark'  ? true  :
        themeMode === 'light' ? false :
        systemScheme === 'dark';

    // Build accent overrides
    let accentOverride;
    let customBase = {};
    if (presetId === 'custom') {
        accentOverride = buildCustomAccent(customHex);
        if (customBgHex) customBase.bg = customBgHex;
        if (customSurfaceHex) customBase.surface = customSurfaceHex;
        if (customTextHex) customBase.text = customTextHex;
    } else {
        const preset = PRESET_THEMES.find(p => p.id === presetId) ?? PRESET_THEMES[0];
        accentOverride = { light: preset.light, dark: preset.dark };
    }

    const base   = isDark ? DarkColors  : LightColors;
    const accent = isDark ? accentOverride.dark : accentOverride.light;
    const colors = { ...base, ...accent, ...customBase };

    return (
        <ThemeContext.Provider value={{
            colors, isDark, themeMode, setThemeMode,
            presetId, setPresetId,
            customHex, setCustomHex,
            customBgHex, setCustomBgHex,
            customSurfaceHex, setCustomSurfaceHex,
            customTextHex, setCustomTextHex,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
