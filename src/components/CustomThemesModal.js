import React, { useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, Modal, StyleSheet,
    ScrollView, TextInput, Platform, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';
import { Typography, Spacing, Radii } from '../constants/theme';
import { PRESET_THEMES, buildCustomAccent } from '../constants/presetThemes';
import { LightColors, DarkColors } from '../constants/theme';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

/* ─── Color Picker Helper ────────────────────────────────────────────────── */
const PALETTE_COLORS = [
    '#06B6D4', '#FFD700', '#FFA07A', '#FF85A1', '#FF6B6B',
    '#FF8C00', '#FF69B4', '#DA70D6', '#B197FC', '#7C4DFF',
    '#74C0FC', '#339AF0', '#64D8FF', '#0099CC', '#4ECEA3',
    '#28A87E', '#62C87A', '#ADFF2F', '#F0E68C', '#E8D870',
    '#FFFFFF', '#CCCCCC', '#888888', '#444444', '#1A1A2E',
];

/* ─── Mini Preview Card ──────────────────────────────────────────────────── */
function PreviewCard({ accentColors, isDark }) {
    const base   = isDark ? DarkColors : LightColors;
    const c      = { ...base, ...accentColors };
    return (
        <View style={[previewStyles.wrapper, { backgroundColor: c.bg }]}>
            {/* Top bar */}
            <View style={[previewStyles.bar, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                <Text style={[previewStyles.barTitle, { color: c.text }]}>✦ Hedeflerim</Text>
                <View style={[previewStyles.barBadge, { backgroundColor: c.accentBg }]}>
                    <Text style={[previewStyles.barBadgeText, { color: c.accentDark }]}>3 Hedef</Text>
                </View>
            </View>

            {/* Sample card */}
            <View style={[previewStyles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={[previewStyles.cardLeft, { backgroundColor: c.accentGlow }]} />
                <View style={{ flex: 1 }}>
                    <Text style={[previewStyles.cardTitle, { color: c.text }]}>IELTS Sınavı</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="book" size={14} color={c.textMuted} style={{ marginRight: 4 }} />
                        <Text style={[previewStyles.cardSub, { color: c.textMuted }]}>Eğitim · 28 gün kaldı</Text>
                    </View>
                </View>
                <View style={[previewStyles.cardChip, { backgroundColor: c.accentBg, borderColor: c.accentDark }]}>
                    <Text style={[previewStyles.cardChipText, { color: c.accentDark }]}>✦</Text>
                </View>
            </View>

            {/* FAB */}
            <View style={[previewStyles.fab, { backgroundColor: c.accent }]}>
                <Text style={[previewStyles.fabText, { color: c.accentDark }]}>+</Text>
            </View>
        </View>
    );
}

const previewStyles = StyleSheet.create({
    wrapper: {
        height: 130,
        borderRadius: Radii.md,
        overflow: 'hidden',
        position: 'relative',
    },
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    barTitle: { fontSize: 11, fontWeight: '700' },
    barBadge: { borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    barBadgeText: { fontSize: 9, fontWeight: '700' },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: 8,
        borderRadius: Radii.sm,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: 'hidden',
        gap: 8,
    },
    cardLeft: { width: 4, alignSelf: 'stretch' },
    cardTitle: { fontSize: 10, fontWeight: '700' },
    cardSub: { fontSize: 8, marginTop: 2 },
    cardChip: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: 8,
    },
    cardChipText: { fontSize: 9, fontWeight: '700' },
    fab: {
        position: 'absolute',
        bottom: 8,
        right: 10,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabText: { fontSize: 16, fontWeight: '700', lineHeight: 20 },
});

/* ─── Main Modal ─────────────────────────────────────────────────────────── */
export default function CustomThemesModal({ visible, onClose }) {
    const { 
        colors, isDark, presetId, setPresetId, 
        customHex, setCustomHex,
        customBgHex, setCustomBgHex,
        customSurfaceHex, setCustomSurfaceHex,
        customTextHex, setCustomTextHex
    } = useTheme();
    const { t } = useLanguage();

    const [tab, setTab] = useState('presets'); // 'presets' | 'custom'
    const [activeProp, setActiveProp] = useState('accent'); // 'accent' | 'bg' | 'surface' | 'text'
    
    const [pendingColors, setPendingColors] = useState({
        accent: customHex || '#06B6D4',
        bg: customBgHex || '',
        surface: customSurfaceHex || '',
        text: customTextHex || '',
    });
    const [hexInput, setHexInput] = useState(pendingColors.accent);
    const [hexError, setHexError] = useState(false);

    // Preview accent colors shown at top
    const previewAccent = useCallback(() => {
        if (tab === 'custom') {
            const acc = buildCustomAccent(pendingColors.accent)[isDark ? 'dark' : 'light'];
            const customBase = {};
            if (pendingColors.bg) customBase.bg = pendingColors.bg;
            if (pendingColors.surface) customBase.surface = pendingColors.surface;
            if (pendingColors.text) customBase.text = pendingColors.text;
            return { ...acc, ...customBase };
        }
        const preset = PRESET_THEMES.find(p => p.id === presetId) ?? PRESET_THEMES[0];
        return isDark ? preset.dark : preset.light;
    }, [tab, presetId, pendingColors, isDark]);

    function pickPreset(id) {
        setPresetId(id);
        setTab('presets');
    }

    function selectColor(hex) {
        setPendingColors(prev => ({ ...prev, [activeProp]: hex }));
        setHexInput(hex);
        setHexError(false);
    }

    function applyCustom() {
        let hex = hexInput.trim();
        // Allow empty string to reset bg/surface/text
        if (hex === '' && activeProp !== 'accent') {
            setPendingColors(prev => ({ ...prev, [activeProp]: '' }));
            setHexError(false);
            return;
        }
        
        if (!hex.startsWith('#')) hex = '#' + hex;
        if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
            setPendingColors(prev => ({ ...prev, [activeProp]: hex }));
            setHexError(false);
        } else {
            setHexError(true);
        }
    }

    function handleHexChange(text) {
        setHexInput(text);
        setHexError(false);
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
                    {/* Handle bar */}
                    <View style={[styles.handle, { backgroundColor: colors.border }]} />

                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            {t('customTheme.title')}
                        </Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                            <Feather name="x" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* ── Live Preview ── */}
                        <View style={styles.previewSection}>
                            <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
                                {t('customTheme.preview')}
                            </Text>
                            <View style={[styles.previewWrapper, { borderColor: colors.border }]}>
                                <PreviewCard
                                    accentColors={previewAccent()}
                                    isDark={isDark}
                                />
                            </View>
                        </View>

                        {/* ── Tab Switcher ── */}
                        <View style={[styles.tabRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                            {[
                                { key: 'presets', label: t('customTheme.tabPresets') },
                                { key: 'custom',  label: t('customTheme.tabCustom')  },
                            ].map(tab_ => (
                                <TouchableOpacity
                                    key={tab_.key}
                                    style={[
                                        styles.tab,
                                        tab === tab_.key && { backgroundColor: colors.surface, borderColor: colors.accentDark },
                                    ]}
                                    onPress={() => setTab(tab_.key)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[
                                        styles.tabText,
                                        { color: tab === tab_.key ? colors.text : colors.textMuted },
                                    ]}>
                                        {tab_.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* ── Presets Grid ── */}
                        {tab === 'presets' && (
                            <View style={styles.presetsGrid}>
                                {PRESET_THEMES.map(preset => {
                                    const isActive = presetId === preset.id;
                                    const accent   = isDark ? preset.dark : preset.light;
                                    return (
                                        <TouchableOpacity
                                            key={preset.id}
                                            style={[
                                                styles.presetCard,
                                                {
                                                    backgroundColor: colors.bg,
                                                    borderColor: isActive ? accent.accentDark : colors.border,
                                                    borderWidth: isActive ? 2 : StyleSheet.hairlineWidth,
                                                },
                                            ]}
                                            onPress={() => pickPreset(preset.id)}
                                            activeOpacity={0.75}
                                        >
                                            {/* Color circle */}
                                            <View style={[styles.presetCircle, { backgroundColor: accent.accentBg }]}>
                                                <View style={[styles.presetDot, { backgroundColor: accent.accent }]} />
                                            </View>

                                            <Text style={[styles.presetName, { color: colors.text }]}>
                                                {t(preset.nameKey)}
                                            </Text>

                                            {isActive && (
                                                <Feather name="check" size={16} color={accent.accentDark} />
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}

                        {/* ── Custom Tab ── */}
                        {tab === 'custom' && (
                            <View style={styles.customSection}>
                                
                                {/* Property Switcher */}
                                <View style={[styles.tabRow, { backgroundColor: colors.bg, borderColor: colors.border, marginBottom: Spacing.md }]}>
                                    {[
                                        { key: 'accent', label: t('customTheme.colorAccent') || 'Vurgu' },
                                        { key: 'bg', label: t('customTheme.colorBg') || 'Arka Plan' },
                                        { key: 'surface', label: t('customTheme.colorSurface') || 'Yüzey' },
                                        { key: 'text', label: t('customTheme.colorText') || 'Metin' },
                                    ].map(prop => (
                                        <TouchableOpacity
                                            key={prop.key}
                                            style={[
                                                styles.tab,
                                                activeProp === prop.key && { backgroundColor: colors.surface, borderColor: colors.accentDark },
                                                { paddingVertical: Spacing.xs, paddingHorizontal: 2 }
                                            ]}
                                            onPress={() => {
                                                setActiveProp(prop.key);
                                                setHexInput(pendingColors[prop.key] || '');
                                                setHexError(false);
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={[
                                                styles.tabText,
                                                { color: activeProp === prop.key ? colors.text : colors.textMuted, fontSize: 10 },
                                            ]} numberOfLines={1}>
                                                {prop.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.sectionLabel, { color: colors.textLight }]}>
                                    {t('customTheme.pickColor')}
                                </Text>

                                {/* Palette grid */}
                                <View style={styles.paletteGrid}>
                                    {PALETTE_COLORS.map(hex => {
                                        const currentVal = pendingColors[activeProp] || '';
                                        const isSelected = currentVal.toLowerCase() === hex.toLowerCase();
                                        return (
                                            <TouchableOpacity
                                                key={hex}
                                                style={[
                                                    styles.paletteCell,
                                                    { backgroundColor: hex },
                                                    isSelected && styles.paletteCellSelected,
                                                    isSelected && { borderColor: colors.accentDark },
                                                    hex === '#FFFFFF' && { borderWidth: 1, borderColor: colors.border },
                                                ]}
                                                onPress={() => selectColor(hex)}
                                                activeOpacity={0.8}
                                            >
                                                {isSelected && (
                                                    <Feather name="check" size={16} color={hex.toUpperCase() === '#FFFFFF' ? '#000' : '#FFF'} style={styles.paletteCellCheck} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {/* Hex Input */}
                                <Text style={[styles.sectionLabel, { color: colors.textLight, marginTop: Spacing.md }]}>
                                    {t('customTheme.hexInput')} {activeProp !== 'accent' && '(Boş bırakılabilir)'}
                                </Text>
                                <View style={styles.hexRow}>
                                    <View style={[styles.hexPreviewDot, { backgroundColor: pendingColors[activeProp] || colors.bg }]} />
                                    <TextInput
                                        style={[
                                            styles.hexInput,
                                            {
                                                color: colors.text,
                                                backgroundColor: colors.bg,
                                                borderColor: hexError ? '#FF6B6B' : colors.border,
                                            },
                                        ]}
                                        value={hexInput}
                                        onChangeText={handleHexChange}
                                        placeholder="#06B6D4"
                                        placeholderTextColor={colors.textMuted}
                                        autoCapitalize="characters"
                                        maxLength={7}
                                        returnKeyType="done"
                                        onSubmitEditing={applyCustom}
                                    />
                                    <TouchableOpacity
                                        style={[styles.hexApplyBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                        onPress={applyCustom}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.hexApplyText, { color: colors.accentDark }]}>
                                            {t('customTheme.apply')}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {hexError && (
                                    <Text style={styles.hexError}>{t('customTheme.hexError')}</Text>
                                )}

                                {/* Apply custom theme button */}
                                <TouchableOpacity
                                    style={[styles.applyMainBtn, { backgroundColor: colors.accent }]}
                                    onPress={() => {
                                        setCustomHex(pendingColors.accent);
                                        setCustomBgHex(pendingColors.bg);
                                        setCustomSurfaceHex(pendingColors.surface);
                                        setCustomTextHex(pendingColors.text);
                                        setPresetId('custom');
                                        onClose();
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.applyMainBtnText, { color: colors.accentDark }]}>
                                        {t('customTheme.useThisTheme')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        paddingBottom: 36,
        maxHeight: '92%',
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 10,
        marginBottom: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerTitle: { fontSize: Typography.md, fontWeight: '700' },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: Typography.md, fontWeight: '600' },

    scrollContent: { padding: Spacing.xl, paddingBottom: 12 },

    previewSection: { marginBottom: Spacing.lg },
    previewWrapper: {
        borderWidth: 1,
        borderRadius: Radii.md,
        overflow: 'hidden',
    },

    sectionLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
    },

    tabRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: 4,
        gap: 4,
        marginBottom: Spacing.lg,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.sm - 2,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    tabText: { fontSize: Typography.xs, fontWeight: '700' },

    /* Presets */
    presetsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    presetCard: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderRadius: Radii.sm,
        padding: Spacing.md,
    },
    presetCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
    },
    presetName: {
        flex: 1,
        fontSize: Typography.sm,
        fontWeight: '600',
    },
    presetCheck: {
        fontSize: Typography.sm,
        fontWeight: '700',
    },

    /* Custom */
    customSection: {},
    paletteGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    paletteCell: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    paletteCellSelected: {
        borderWidth: 3,
    },
    paletteCellCheck: {
        fontSize: 16,
        fontWeight: '700',
        color: '#fff',
        textShadowColor: 'rgba(0,0,0,0.6)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    hexRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    hexPreviewDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    hexInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.sm,
        fontWeight: '600',
    },
    hexApplyBtn: {
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    hexApplyText: { fontSize: Typography.sm, fontWeight: '700' },
    hexError: {
        color: '#FF6B6B',
        fontSize: Typography.xs,
        marginTop: Spacing.xs,
    },

    applyMainBtn: {
        marginTop: Spacing.lg,
        borderRadius: Radii.sm,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    applyMainBtnText: { fontSize: Typography.base, fontWeight: '700' },
});
