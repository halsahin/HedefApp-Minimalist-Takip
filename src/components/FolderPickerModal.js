import React, { useState, useRef, useEffect } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, Keyboard, Animated,
    Dimensions, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function FolderPickerModal({
    visible, onClose,
    folders, activeFolderId,
    onSelectFolder, onAddFolder, onRenameFolder, onDeleteFolder,
}) {
    const { t } = useLanguage();
    const { colors, isDark } = useTheme();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

    const [newFolderInput, setNewFolderInput] = useState('');
    const [showNewInput, setShowNewInput] = useState(false);
    const [renamingId, setRenamingId] = useState(null);
    const [renameInput, setRenameInput] = useState('');
    const [editMode, setEditMode] = useState(false);
    const newInputRef = useRef(null);
    const renameInputRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setShowNewInput(false);
            setNewFolderInput('');
            setRenamingId(null);
            setRenameInput('');
            setEditMode(false);
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                bounciness: 3,
                speed: 18,
            }).start();
        }
    }, [visible]);

    function close() {
        Keyboard.dismiss();
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 220,
            useNativeDriver: true,
        }).start(() => onClose());
    }

    function handleSelect(id) {
        onSelectFolder(id);
        close();
    }

    function handleAddSubmit() {
        const name = newFolderInput.trim();
        if (!name) return;
        onAddFolder(name);
        setNewFolderInput('');
        setShowNewInput(false);
        Keyboard.dismiss();
    }

    function handleRenameSubmit() {
        const name = renameInput.trim();
        if (!name || !renamingId) return;
        onRenameFolder(renamingId, name);
        setRenamingId(null);
        setRenameInput('');
        Keyboard.dismiss();
    }

    function handleRenamePress(folder) {
        setRenamingId(folder.id);
        setRenameInput(folder.name);
        setTimeout(() => renameInputRef.current?.focus(), 150);
    }

    function handleDeletePress(folder) {
        Alert.alert(
            t('folder.deleteTitle'),
            t('folder.deleteMsg', { name: folder.name }),
            [
                { text: t('folder.cancel'), style: 'cancel' },
                {
                    text: t('folder.delete'),
                    style: 'destructive',
                    onPress: () => {
                        onDeleteFolder(folder.id);
                        if (renamingId === folder.id) setRenamingId(null);
                    },
                },
            ]
        );
    }

    const allItem = { id: null, name: t('folder.all'), isAll: true };
    const listData = [allItem, ...folders];

    return (
        <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={close} />

            <KeyboardAvoidingView
                style={styles.kavWrapper}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}>
                    {/* Handle */}
                    <View style={styles.handleArea}>
                        <View style={[styles.handle, { backgroundColor: colors.border }]} />
                    </View>

                    {/* Başlık */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.title, { color: colors.text }]}>{t('folder.title')}</Text>
                        <View style={styles.headerActions}>
                            <TouchableOpacity
                                onPress={() => {
                                    setEditMode(e => !e);
                                    setRenamingId(null);
                                    setShowNewInput(false);
                                    setNewFolderInput('');
                                    Keyboard.dismiss();
                                }}
                                style={styles.editModeBtn}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.editModeBtnText, { color: colors.accentDark }]}>
                                    {editMode ? t('folder.done') : t('folder.edit')}
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={close} style={[styles.closeBtn, { backgroundColor: colors.bg }]} activeOpacity={0.7}>
                                <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Klasör listesi */}
                    <ScrollView
                        style={styles.scroll}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                        bounces={false}
                    >
                        {listData.map(item => {
                            const isActive = item.id === activeFolderId;
                            const isRenaming = renamingId !== null && renamingId === item.id;
                            const canEdit = !item.isAll && item.id !== 'default';

                            return (
                                <TouchableOpacity
                                    key={String(item.id)}
                                    style={[
                                        styles.folderRow,
                                        { borderBottomColor: colors.border },
                                        isActive && !editMode && { backgroundColor: colors.accentBg },
                                    ]}
                                    onPress={() => {
                                        if (editMode) return;
                                        if (isRenaming) return;
                                        handleSelect(item.id);
                                    }}
                                    activeOpacity={editMode || isRenaming ? 1 : 0.75}
                                >
                                    <Text style={styles.folderIcon}>
                                        {item.isAll ? '🗂️' : item.id === 'default' ? '📁' : '📂'}
                                    </Text>

                                    {isRenaming ? (
                                        <TextInput
                                            ref={renameInputRef}
                                            style={[styles.renameInput, { color: colors.text, borderColor: colors.accentDark }]}
                                            value={renameInput}
                                            onChangeText={setRenameInput}
                                            onSubmitEditing={handleRenameSubmit}
                                            returnKeyType="done"
                                            maxLength={40}
                                        />
                                    ) : (
                                        <Text style={[
                                            styles.folderName,
                                            { color: item.isAll ? colors.textMuted : colors.text },
                                            isActive && !editMode && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' },
                                        ]}>
                                            {item.name}
                                        </Text>
                                    )}

                                    <View style={styles.folderRight}>
                                        {isRenaming ? (
                                            <TouchableOpacity
                                                onPress={handleRenameSubmit}
                                                style={[styles.actionChip, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                            >
                                                <Text style={[styles.actionChipText, { color: isDark ? colors.accent : '#5A4800' }]}>
                                                    {t('folder.save')}
                                                </Text>
                                            </TouchableOpacity>
                                        ) : editMode && canEdit ? (
                                            <View style={styles.editBtns}>
                                                <TouchableOpacity
                                                    onPress={() => handleRenamePress(item)}
                                                    style={[styles.editIconBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Text style={styles.editIconBtnText}>✏️</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    onPress={() => handleDeletePress(item)}
                                                    style={[styles.editIconBtn, { backgroundColor: colors.bg, borderColor: colors.border }]}
                                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                >
                                                    <Text style={styles.editIconBtnText}>🗑️</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : !editMode && isActive ? (
                                            <Text style={[styles.checkmark, { color: colors.accentDark }]}>✓</Text>
                                        ) : null}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                        <View style={{ height: Spacing.md }} />
                    </ScrollView>

                    {/* Alt alan: sadece edit modda yeni klasör */}
                    {editMode && (
                        <View style={[styles.addSection, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
                            {showNewInput ? (
                                <View style={[styles.newInputRow, { borderColor: colors.accentDark, backgroundColor: colors.bg }]}>
                                    <TextInput
                                        ref={newInputRef}
                                        style={[styles.newInput, { color: colors.text }]}
                                        placeholder={t('folder.namePlaceholder')}
                                        placeholderTextColor={colors.textLight}
                                        value={newFolderInput}
                                        onChangeText={setNewFolderInput}
                                        onSubmitEditing={handleAddSubmit}
                                        returnKeyType="done"
                                        maxLength={40}
                                        autoFocus
                                    />
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                        onPress={handleAddSubmit}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.iconBtnText, { color: isDark ? colors.accent : '#5A4800' }]}>✓</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.iconBtn, { borderColor: colors.border }]}
                                        onPress={() => { setShowNewInput(false); setNewFolderInput(''); Keyboard.dismiss(); }}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.iconBtnText, { color: colors.textMuted }]}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.addBtn, { borderColor: colors.accentDark, backgroundColor: colors.accentBg }]}
                                    onPress={() => {
                                        setShowNewInput(true);
                                        setTimeout(() => newInputRef.current?.focus(), 80);
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.addBtnText, { color: isDark ? colors.accent : '#5A4800' }]}>
                                        {t('folder.new')}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <View style={{ height: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg }} />
                        </View>
                    )}
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10,10,30,0.45)',
    },
    kavWrapper: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
    },
    sheet: {
        borderTopLeftRadius: Radii.xl,
        borderTopRightRadius: Radii.xl,
        maxHeight: SCREEN_HEIGHT * 0.80,
        ...Shadows.md,
    },
    handleArea: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: 4 },
    handle: { width: 36, height: 4, borderRadius: Radii.full },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: { fontSize: Typography.md, fontWeight: '700' },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    editModeBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 4 },
    editModeBtnText: { fontSize: Typography.sm, fontWeight: '700' },
    closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    closeBtnText: { fontSize: Typography.sm, fontWeight: '600' },
    scroll: { maxHeight: SCREEN_HEIGHT * 0.45 },
    folderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        paddingVertical: Spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        gap: Spacing.md,
    },
    folderIcon: { fontSize: 20, width: 28, textAlign: 'center' },
    folderName: { flex: 1, fontSize: Typography.base, fontWeight: '500' },
    folderRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, minWidth: 60, justifyContent: 'flex-end' },
    checkmark: { fontSize: Typography.base, fontWeight: '700' },
    editBtns: { flexDirection: 'row', gap: Spacing.xs },
    editIconBtn: { width: 32, height: 32, borderRadius: Radii.sm, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    editIconBtnText: { fontSize: 15 },
    renameInput: {
        flex: 1,
        fontSize: Typography.base,
        borderBottomWidth: 1.5,
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    actionChip: {
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    actionChipText: { fontSize: Typography.sm, fontWeight: '700' },
    addSection: {
        borderTopWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.md,
    },
    addBtn: {
        borderWidth: 1.5,
        borderRadius: Radii.md,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    addBtnText: { fontSize: Typography.sm, fontWeight: '700' },
    newInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: Radii.md,
        paddingHorizontal: Spacing.md,
        paddingVertical: 4,
        gap: Spacing.xs,
    },
    newInput: { flex: 1, fontSize: Typography.base, paddingVertical: Spacing.sm },
    iconBtn: {
        borderWidth: 1,
        borderRadius: Radii.sm,
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBtnText: { fontSize: Typography.base, fontWeight: '700' },
});
