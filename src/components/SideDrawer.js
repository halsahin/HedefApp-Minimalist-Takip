import React, { useEffect, useRef, useState } from 'react';
import {
    View, Text, TouchableOpacity, Animated, ScrollView,
    Modal, StyleSheet, Dimensions, Platform, StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { exportBackup, importBackup } from '../utils/backup';
import { downloadFromDrive, getGoogleUserInfo, signOutFromGoogle } from '../utils/googleDrive';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage, LANGUAGES } from '../i18n/LanguageContext';
import { Typography, Spacing, Radii } from '../constants/theme';
import CustomThemesModal from './CustomThemesModal';
import { Feather } from '@expo/vector-icons';

const DRAWER_WIDTH = Math.min(Dimensions.get('window').width * 0.80, 320);
const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

export default function SideDrawer({
    visible, onClose, onStatsPress, onCalendarPress, onCounterPress, onRestoreSuccess,
    folders, activeFolderId, onSelectFolder, onManageFolders,
}) {
    const { colors, themeMode, setThemeMode, isDark } = useTheme();
    const { language, setLanguage, t, locale } = useLanguage();
    const toUpper = (str) => str ? str.toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US') : '';
    const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const animRef = useRef(null);
    const [backupLoading, setBackupLoading] = useState(false);
    const [showCustomThemes, setShowCustomThemes] = useState(false);
    const [isDriveSyncOn, setIsDriveSyncOn] = useState(false);

    const [driveEmail, setDriveEmail] = useState(null);

    useEffect(() => {
        if (visible) {
            AsyncStorage.getItem('drive_autosync').then(val => {
                const isOn = val === 'true';
                setIsDriveSyncOn(isOn);
                if (isOn) {
                    getGoogleUserInfo().then(info => {
                        if (info && info.email) {
                            setDriveEmail(info.email);
                        }
                    });
                }
            });
        }
    }, [visible]);

    useEffect(() => {
        if (animRef.current) animRef.current.stop();
        if (visible) {
            animRef.current = Animated.parallel([
                Animated.spring(translateX, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 18 }),
                Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]);
        } else {
            animRef.current = Animated.parallel([
                Animated.timing(translateX, { toValue: DRAWER_WIDTH, duration: 220, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
            ]);
        }
        animRef.current.start();
    }, [visible]);

    const themeOptions = [
        { key: 'light', label: t('drawer.themeLight'), icon: 'sun' },
        { key: 'dark',  label: t('drawer.themeDark'),  icon: 'moon' },
        { key: 'system',label: t('drawer.themeSystem'),icon: 'smartphone' },
    ];

    function handleNav(action) {
        onClose();
        setTimeout(action, 240);
    }

    async function handleExport() {
        setBackupLoading(true);
        const result = await exportBackup();
        setBackupLoading(false);
        if (result === 'error') {
            Alert.alert('', t('backup.exportError'));
        }
        // 'ok' durumunda sistem paylaşma diyalogu zaten açıldı
        // 'share_unavailable' durumunda sessizce geç (cihaz desteği yok)
    }

    async function handleImport() {
        Alert.alert(
            t('backup.importTitle'),
            t('backup.importWarning'),
            [
                { text: t('backup.cancel'), style: 'cancel' },
                {
                    text: t('backup.importConfirm'),
                    onPress: async () => {
                        setBackupLoading(true);
                        const result = await importBackup();
                        setBackupLoading(false);
                        if (result.status === 'ok') {
                            Alert.alert('', t('backup.importSuccess', { n: result.count }), [
                                {
                                    text: t('backup.restart'),
                                    onPress: () => { onClose(); onRestoreSuccess?.(); },
                                },
                            ]);
                        } else if (result.status === 'invalid') {
                            Alert.alert('', t('backup.importInvalid'));
                        } else if (result.status === 'error') {
                            Alert.alert('', t('backup.importError'));
                        }
                        // cancelled → hiçbir şey yapma
                    },
                },
            ]
        );
    }

    async function handleDriveImport() {
        Alert.alert(
            t('backup.importTitle'),
            t('backup.importWarning'),
            [
                { text: t('backup.cancel'), style: 'cancel' },
                {
                    text: t('backup.importConfirm'),
                    onPress: async () => {
                        setBackupLoading(true);
                        const result = await downloadFromDrive();
                        setBackupLoading(false);
                        if (result.success && result.data) {
                            try {
                                const data = result.data;
                                const goals = Array.isArray(data) ? data : data?.goals;
                                
                                if (!Array.isArray(goals)) {
                                    Alert.alert('', t('backup.importInvalid'));
                                    return;
                                }

                                const ops = [AsyncStorage.setItem('goaltracker_v2', JSON.stringify(goals))];
                                if (Array.isArray(data?.folders) && data.folders.length > 0) {
                                    ops.push(AsyncStorage.setItem('goaltracker_folders_v1', JSON.stringify(data.folders)));
                                }
                                await Promise.all(ops);

                                Alert.alert('', t('backup.importSuccess', { n: goals.length }), [
                                    {
                                        text: t('backup.restart'),
                                        onPress: () => { onClose(); onRestoreSuccess?.(); },
                                    },
                                ]);
                            } catch(e) {
                                Alert.alert('', t('backup.importError'));
                            }
                        } else if (result.success && !result.data) {
                            Alert.alert('', t('backup.importInvalid'));
                        } else {
                            Alert.alert('', t('backup.importError'));
                        }
                    },
                },
            ]
        );
    }
    async function handleChangeDriveAccount() {
        Alert.alert(
            t('backup.changeAccountTitle') || 'Hesabı Değiştir',
            t('backup.changeAccountWarning') || 'Mevcut Google Drive hesabınızdan çıkış yapılacak ve senkronizasyon kapatılacak. Devam etmek istiyor musunuz?',
            [
                { text: t('backup.cancel'), style: 'cancel' },
                {
                    text: t('backup.logout') || 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await signOutFromGoogle();
                        await AsyncStorage.setItem('drive_autosync', 'false');
                        setIsDriveSyncOn(false);
                        setDriveEmail(null);
                    }
                }
            ]
        );
    }

    return (<>
        <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
            <Animated.View style={[styles.overlay, { opacity }]}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
            </Animated.View>

            <Animated.View style={[
                styles.drawer,
                { backgroundColor: colors.surface, transform: [{ translateX }] }
            ]}>
                {/* Header */}
                <View style={[styles.drawerHeader, { borderBottomColor: colors.border, paddingTop: STATUS_BAR_HEIGHT + Spacing.lg }]}>
                    <View style={styles.logoRow}>
                        <Text style={[styles.logoIcon, { color: colors.accentDark }]}>✦</Text>
                        <Text style={[styles.logoText, { color: colors.text }]}>{t('header.title')}</Text>
                    </View>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                        <Feather name="x" size={24} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Kaydırılabilir İçerik */}
                <ScrollView
                    style={styles.scrollContent}
                    contentContainerStyle={styles.scrollContentContainer}
                    showsVerticalScrollIndicator={true}
                    bounces={true}
                >
                    {/* Klasörler */}
                    {folders && folders.length > 0 && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeaderRow}>
                                <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{toUpper(t('folder.title'))}</Text>
                                <TouchableOpacity onPress={() => { onClose(); setTimeout(onManageFolders, 240); }} activeOpacity={0.7}>
                                    <Text style={[styles.sectionAction, { color: colors.accentDark }]}>{t('folder.manage')}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Tümü seçeneği */}
                            <TouchableOpacity
                                style={[styles.folderItem, { borderBottomColor: colors.border }, activeFolderId === null && { backgroundColor: colors.accentBg, borderRadius: Radii.sm }]}
                                onPress={() => { onSelectFolder(null); onClose(); }}
                                activeOpacity={0.75}
                            >
                                <Feather name="layers" size={16} color={colors.textMuted} style={styles.folderItemIcon} />
                                <Text style={[styles.folderItemText, { color: colors.text }, activeFolderId === null && { fontWeight: '700', color: isDark ? colors.accent : colors.accentDark }]}>
                                    {t('folder.all')}
                                </Text>
                                {activeFolderId === null && <Feather name="check" size={16} color={colors.accentDark} />}
                            </TouchableOpacity>

                            {folders.map(f => (
                                <TouchableOpacity
                                    key={f.id}
                                    style={[styles.folderItem, { borderBottomColor: colors.border }, activeFolderId === f.id && { backgroundColor: colors.accentBg, borderRadius: Radii.sm }]}
                                    onPress={() => { onSelectFolder(f.id); onClose(); }}
                                    activeOpacity={0.75}
                                >
                                    <Feather name="folder" size={16} color={f.id === 'default' ? colors.textMuted : colors.accent} style={styles.folderItemIcon} />
                                    <Text style={[styles.folderItemText, { color: colors.text }, activeFolderId === f.id && { fontWeight: '700', color: isDark ? colors.accent : colors.accentDark }]}>
                                        {f.name}
                                    </Text>
                                    {activeFolderId === f.id && <Feather name="check" size={16} color={colors.accentDark} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    {/* Navigation */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{toUpper(t('drawer.navigate'))}</Text>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleNav(onStatsPress)}
                            activeOpacity={0.75}
                        >
                            <Feather name="pie-chart" size={18} color={colors.textMuted} style={styles.menuItemIcon} />
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('stats.title')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleNav(onCalendarPress)}
                            activeOpacity={0.75}
                        >
                            <Feather name="calendar" size={18} color={colors.textMuted} style={styles.menuItemIcon} />
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('calendar.title')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => handleNav(onCounterPress)}
                            activeOpacity={0.75}
                        >
                            <Feather name="clock" size={18} color={colors.textMuted} style={styles.menuItemIcon} />
                            <Text style={[styles.menuItemText, { color: colors.text }]}>{t('counter.title')}</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Theme */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{toUpper(t('drawer.theme'))}</Text>
                        <View style={[styles.themeRow, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                            {themeOptions.map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.themeBtn,
                                        themeMode === opt.key && { backgroundColor: colors.surface, borderColor: colors.accentDark }
                                    ]}
                                    onPress={() => setThemeMode(opt.key)}
                                    activeOpacity={0.75}
                                >
                                    <Feather name={opt.icon} size={16} color={themeMode === opt.key ? colors.text : colors.textMuted} style={styles.themeBtnIcon} />
                                    <Text style={[styles.themeBtnText, { color: themeMode === opt.key ? colors.text : colors.textMuted }]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Özel Temalar butonu */}
                        <TouchableOpacity
                            style={[styles.customThemeBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                            onPress={() => setShowCustomThemes(true)}
                            activeOpacity={0.75}
                        >
                            <Feather name="sliders" size={18} color={isDark ? colors.accent : '#111'} style={styles.customThemeBtnIcon} />
                            <Text style={[styles.customThemeBtnText, { color: isDark ? colors.accent : colors.accentDark }]}>
                                {t('drawer.customThemes')}
                            </Text>
                            <Text style={[styles.customThemeArrow, { color: colors.accentDark }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Backup */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{toUpper(t('backup.title'))}</Text>
                        
                        <TouchableOpacity
                            style={[
                                styles.backupBtn, 
                                { marginBottom: Spacing.sm },
                                isDriveSyncOn 
                                    ? { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                                    : { backgroundColor: colors.surface2, borderColor: colors.border }
                            ]}
                            onPress={async () => {
                                const newValue = !isDriveSyncOn;
                                await AsyncStorage.setItem('drive_autosync', newValue.toString());
                                setIsDriveSyncOn(newValue);
                                Alert.alert('', newValue ? t('backup.driveSyncEnabled') : t('backup.driveSyncDisabled'));
                            }}
                            activeOpacity={0.75}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="cloud" size={16} color={isDriveSyncOn ? (isDark ? colors.accent : colors.accentDark) : colors.textMuted} />
                                <Text style={[
                                    styles.backupBtnText, 
                                    { marginLeft: 8 },
                                    isDriveSyncOn 
                                        ? { color: isDark ? colors.accent : colors.accentDark, fontWeight: '700' }
                                        : { color: colors.textMuted }
                                ]}>
                                    {isDriveSyncOn ? t('backup.driveSyncOn') : t('backup.driveSyncOff')}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {isDriveSyncOn && driveEmail && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: Spacing.sm, marginTop: -4 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                                    <Feather name="user" size={14} color={colors.textLight} />
                                    <Text style={{ fontSize: Typography.xs, color: colors.textLight, marginLeft: 6 }} numberOfLines={1}>
                                        {driveEmail}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={handleChangeDriveAccount} style={{ paddingVertical: 4, paddingLeft: 8 }}>
                                    <Text style={{ fontSize: Typography.xs, color: isDark ? colors.accent : colors.accentDark, fontWeight: '600' }}>
                                        {t('backup.changeAccountTitle') || 'Değiştir'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {isDriveSyncOn && (
                            <TouchableOpacity
                                style={[styles.backupBtn, { backgroundColor: colors.surface2, borderColor: colors.border, marginBottom: Spacing.sm }]}
                                onPress={handleDriveImport}
                                activeOpacity={0.75}
                                disabled={backupLoading}
                            >
                                {backupLoading
                                    ? <ActivityIndicator size="small" color={colors.textMuted} />
                                    : <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Feather name="download-cloud" size={16} color={colors.textMuted} />
                                        <Text style={[styles.backupBtnText, { color: colors.textMuted, marginLeft: 8 }]}>
                                            {t('backup.driveDownload')}
                                        </Text>
                                    </View>
                                }
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.backupBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                            onPress={handleExport}
                            activeOpacity={0.75}
                            disabled={backupLoading}
                        >
                            {backupLoading
                                ? <ActivityIndicator size="small" color={colors.accentDark} />
                                : <Text style={[styles.backupBtnText, { color: isDark ? colors.accent : colors.accentDark }]}>
                                    {t('backup.export')}
                                  </Text>
                            }
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.backupBtn, { backgroundColor: colors.surface2, borderColor: colors.border, marginTop: Spacing.xs }]}
                            onPress={handleImport}
                            activeOpacity={0.75}
                            disabled={backupLoading}
                        >
                            <Text style={[styles.backupBtnText, { color: colors.textMuted }]}>
                                {t('backup.import')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Language */}
                    <View style={styles.section}>
                        <Text style={[styles.sectionLabel, { color: colors.textLight }]}>{toUpper(t('drawer.language'))}</Text>
                        {LANGUAGES.map(lang => (
                            <TouchableOpacity
                                key={lang.code}
                                style={[
                                    styles.langItem,
                                    { borderBottomColor: colors.border },
                                    language === lang.code && { backgroundColor: colors.accentBg, borderRadius: Radii.sm }
                                ]}
                                onPress={() => setLanguage(lang.code)}
                                activeOpacity={0.75}
                            >
                                <Text style={styles.langItemFlag}>{lang.flag}</Text>
                                <Text style={[
                                    styles.langItemText,
                                    { color: colors.text },
                                    language === lang.code && { fontWeight: '700', color: isDark ? colors.accent : colors.accentDark }
                                ]}>
                                    {lang.label}
                                </Text>
                                {language === lang.code && (
                                    <Feather name="check" size={16} color={colors.accentDark} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </Animated.View>
        </Modal>

        <CustomThemesModal
            visible={showCustomThemes}
            onClose={() => setShowCustomThemes(false)}
        /></>);
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    drawer: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: DRAWER_WIDTH,
        shadowColor: '#000',
        shadowOffset: { width: -4, height: 0 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
        elevation: 24,
        overflow: 'hidden',
    },
    scrollContent: {
        flex: 1,
    },
    scrollContentContainer: {
        paddingBottom: 32,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.lg,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    logoIcon: { fontSize: 16 },
    logoText: { fontSize: Typography.md, fontWeight: '700', letterSpacing: -0.3 },
    closeBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: Typography.md, fontWeight: '600' },

    section: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing.xs },
    sectionLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginBottom: Spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuItemIcon: { fontSize: 20 },
    menuItemText: { fontSize: Typography.base, fontWeight: '500' },

    themeRow: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: Radii.sm,
        padding: 4,
        gap: 4,
    },
    themeBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderRadius: Radii.sm - 2,
        borderWidth: 1,
        borderColor: 'transparent',
        gap: 3,
    },
    themeBtnIcon: { fontSize: 15 },
    themeBtnText: { fontSize: Typography.xs, fontWeight: '600' },

    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
    sectionAction: { fontSize: Typography.xs, fontWeight: '700' },
    folderItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    folderItemIcon: { fontSize: 16 },
    folderItemText: { flex: 1, fontSize: Typography.sm, fontWeight: '500' },
    backupBtn: {
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingVertical: Spacing.md - 2,
        alignItems: 'center',
    },
    backupBtnText: { fontSize: Typography.sm, fontWeight: '700' },
    langItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.sm,
    },
    langItemFlag: { fontSize: 18 },
    langItemText: { flex: 1, fontSize: Typography.sm, fontWeight: '500' },
    checkmark: { fontSize: Typography.sm, fontWeight: '700' },
    customThemeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
    },
    customThemeBtnIcon: { fontSize: 16 },
    customThemeBtnText: { flex: 1, fontSize: Typography.sm, fontWeight: '700' },
    customThemeArrow: { fontSize: 18, fontWeight: '600' },
});
