import React, { useState, useRef, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    KeyboardAvoidingView,
    Keyboard,
    Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { CATEGORIES, CATEGORY_MAP } from '../constants/categories';
import { calcRemainingDays, formatDate, deadlineFromDays } from '../utils/dateUtils';

/**
 * GoalDetailModal — tam ekran detay + gelişim günlüğü.
 *
 * State mimarisi (bağımsız, çakışmaz):
 *   isEditingGoal  boolean  → ana hedef formu göster/gizle
 *   updateInput    object   → { mode: 'none'|'add'|'edit', id, text }
 *
 * Klavye güvenliği:
 *   KAV (behavior="padding") + ScrollView → her input klavyenin üstünde kalır.
 */
export default function GoalDetailModal({
    goal,
    visible,
    onClose,
    onUpdateGoal,
    onAddUpdate,
    onEditUpdate,
    onDeleteUpdate,
}) {
    // ── Ana hedef düzenleme state'i ───────────────────────────
    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDeadlineMode, setEditDeadlineMode] = useState('date');
    const [editDate, setEditDate] = useState(new Date());
    const [editDays, setEditDays] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // ── Güncelleme not state'i (ana hedeften tamamen bağımsız) ─
    // mode: 'none' | 'add' | 'edit'
    const [updateInput, setUpdateInput] = useState({ mode: 'none', id: null, text: '' });

    const scrollRef = useRef(null);

    // Modal açılınca her şeyi sıfırla
    useEffect(() => {
        if (visible && goal) {
            setIsEditingGoal(false);
            setUpdateInput({ mode: 'none', id: null, text: '' });
            setShowDatePicker(false);
            populateEditForm(goal);
        }
    }, [visible, goal?.id]);

    function populateEditForm(g) {
        setEditName(g.name);
        setEditCategory(g.category);
        setEditDeadlineMode('date');
        setEditDate(new Date(g.deadline + 'T12:00:00'));
        setEditDays('');
        setEditDesc(g.description || '');
    }

    // ── Ana hedef kaydet ──────────────────────────────────────
    function saveGoalEdit() {
        if (!editName.trim()) return;
        let deadline;
        if (editDeadlineMode === 'date') {
            deadline = [
                editDate.getFullYear(),
                String(editDate.getMonth() + 1).padStart(2, '0'),
                String(editDate.getDate()).padStart(2, '0'),
            ].join('-');
        } else {
            const d = parseInt(editDays, 10);
            if (isNaN(d) || d < 1) return;
            deadline = deadlineFromDays(d);
        }
        onUpdateGoal(goal.id, { name: editName, category: editCategory, deadline, description: editDesc });
        setIsEditingGoal(false);
        Keyboard.dismiss();
    }

    function cancelGoalEdit() {
        setIsEditingGoal(false);
        setShowDatePicker(false);
        Keyboard.dismiss();
    }

    // ── Güncelleme not işlemleri ──────────────────────────────
    function openAddUpdate() {
        setUpdateInput({ mode: 'add', id: null, text: '' });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }

    function openEditUpdate(upd) {
        setUpdateInput({ mode: 'edit', id: upd.id, text: upd.text });
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 250);
    }

    function cancelUpdateInput() {
        setUpdateInput({ mode: 'none', id: null, text: '' });
        Keyboard.dismiss();
    }

    function saveAddUpdate() {
        if (!updateInput.text.trim()) return;
        onAddUpdate(goal.id, updateInput.text);
        setUpdateInput({ mode: 'none', id: null, text: '' });
        Keyboard.dismiss();
    }

    function saveEditUpdate() {
        if (!updateInput.text.trim()) return;
        onEditUpdate(goal.id, updateInput.id, updateInput.text);
        setUpdateInput({ mode: 'none', id: null, text: '' });
        Keyboard.dismiss();
    }

    function confirmDeleteUpdate(updateId) {
        Alert.alert('Güncellemeyi sil', 'Bu notu silmek istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: () => onDeleteUpdate(goal.id, updateId) },
        ]);
    }

    if (!goal) return null;

    const days = calcRemainingDays(goal.deadline);
    const overdue = !goal.completed && days < 0;
    const icon = CATEGORY_MAP[goal.category] || '📌';
    const stripColor = goal.completed
        ? Colors.success
        : goal.pinned ? Colors.accentDark
            : overdue ? Colors.danger
                : Colors.accent;

    const formattedEditDate = editDate.toLocaleDateString('tr-TR', {
        day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            {/*
        KAV tam ekranı kaplar (flex:1).
        behavior="padding" → klavye açılınca KAV sıkışır, ScrollView içeriği kayar.
        Bu Android Modal'ında her zaman çalışan en güvenilir yaklaşımdır.
      */}
            <KeyboardAvoidingView
                style={styles.root}
                behavior="padding"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                {/* ── Top bar ── */}
                <View style={[styles.topBar, { borderBottomColor: stripColor }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
                        <Text style={styles.backBtnText}>← Geri</Text>
                    </TouchableOpacity>
                    <Text style={styles.topBarTitle} numberOfLines={1}>{goal.name}</Text>

                    {/* Sağ üst buton: Düzenle / İptal (YALNIZCA ana hedef için) */}
                    {isEditingGoal ? (
                        <TouchableOpacity style={styles.topActionBtn} onPress={cancelGoalEdit} activeOpacity={0.7}>
                            <Text style={[styles.topActionBtnText, { color: Colors.textMuted }]}>İptal</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.topActionBtn}
                            onPress={() => { populateEditForm(goal); setIsEditingGoal(true); }}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.topActionBtnText}>Düzenle</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* ── Kaydırılabilir içerik ── */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ══════════════════════════════════════════
              BÖLÜM 1 — Ana Hedef Bilgileri
          ══════════════════════════════════════════ */}
                    <View style={styles.card}>
                        <View style={[styles.cardStrip, { backgroundColor: stripColor }]} />
                        <View style={styles.cardBody}>

                            {isEditingGoal ? (
                                /* ── Düzenleme Formu ── */
                                <>
                                    <Text style={styles.formSectionTitle}>Ana Hedefi Düzenle</Text>

                                    <Text style={styles.fieldLabel}>Hedef Adı *</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder="Hedef adı"
                                        placeholderTextColor={Colors.textLight}
                                        maxLength={100}
                                    />

                                    <Text style={styles.fieldLabel}>Kategori</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.categoryScroll}
                                        keyboardShouldPersistTaps="handled"
                                    >
                                        {CATEGORIES.map(cat => {
                                            const active = editCategory === cat.label;
                                            return (
                                                <TouchableOpacity
                                                    key={cat.label}
                                                    style={[styles.catChip, active && styles.catChipActive]}
                                                    onPress={() => setEditCategory(cat.label)}
                                                    activeOpacity={0.75}
                                                >
                                                    <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                                                        {cat.icon} {cat.label}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    <Text style={styles.fieldLabel}>Bitiş Tarihi</Text>
                                    <View style={styles.toggle}>
                                        {['date', 'days'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.toggleBtn, editDeadlineMode === m && styles.toggleBtnActive]}
                                                onPress={() => { setEditDeadlineMode(m); setShowDatePicker(false); }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.toggleBtnText, editDeadlineMode === m && styles.toggleBtnTextActive]}>
                                                    {m === 'date' ? 'Tarih Seç' : 'Gün Say'}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {editDeadlineMode === 'date' && (
                                        <>
                                            <TouchableOpacity
                                                style={styles.dateTrigger}
                                                onPress={() => setShowDatePicker(v => !v)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={styles.dateTriggerText}>📅 {formattedEditDate}</Text>
                                                <Text style={styles.dateTriggerArrow}>{showDatePicker ? '▴' : '▾'}</Text>
                                            </TouchableOpacity>
                                            {showDatePicker && (
                                                <DateTimePicker
                                                    value={editDate}
                                                    mode="date"
                                                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                                                    minimumDate={new Date()}
                                                    onChange={(_, date) => {
                                                        if (Platform.OS === 'android') setShowDatePicker(false);
                                                        if (date) setEditDate(date);
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}

                                    {editDeadlineMode === 'days' && (
                                        <View style={styles.daysRow}>
                                            <TextInput
                                                style={[styles.input, { flex: 1 }]}
                                                placeholder="örn. 30"
                                                placeholderTextColor={Colors.textLight}
                                                value={editDays}
                                                onChangeText={setEditDays}
                                                keyboardType="numeric"
                                                maxLength={4}
                                            />
                                            <Text style={styles.daysUnit}>gün</Text>
                                        </View>
                                    )}

                                    <Text style={styles.fieldLabel}>Notlar (isteğe bağlı)</Text>
                                    <TextInput
                                        style={[styles.input, styles.textarea]}
                                        value={editDesc}
                                        onChangeText={setEditDesc}
                                        placeholder="Kısa bir not..."
                                        placeholderTextColor={Colors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        maxLength={300}
                                        textAlignVertical="top"
                                    />

                                    <TouchableOpacity style={styles.saveBtn} onPress={saveGoalEdit} activeOpacity={0.8}>
                                        <Text style={styles.saveBtnText}>✓ Kaydet</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                /* ── Salt Okunur Görünüm ── */
                                <>
                                    <View style={styles.categoryRow}>
                                        <View style={styles.categoryBadge}>
                                            <Text style={styles.categoryBadgeText}>{icon} {goal.category}</Text>
                                        </View>
                                        {goal.completed && (
                                            <View style={styles.doneBadge}>
                                                <Text style={styles.doneBadgeText}>✓ Tamamlandı</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.goalName}>{goal.name}</Text>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>📅 Bitiş Tarihi</Text>
                                        <Text style={styles.infoValue}>{formatDate(goal.deadline)}</Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>⏳ Kalan</Text>
                                        <Text style={[
                                            styles.infoValue,
                                            overdue && { color: Colors.danger },
                                            goal.completed && { color: Colors.success },
                                        ]}>
                                            {goal.completed
                                                ? 'Tamamlandı'
                                                : overdue
                                                    ? `${Math.abs(days)} gün geçti`
                                                    : `${days} gün`}
                                        </Text>
                                    </View>

                                    {!!goal.description && (
                                        <View style={styles.noteBox}>
                                            <Text style={styles.noteLabel}>📝 NOTLAR</Text>
                                            <Text style={styles.noteText}>{goal.description}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* ── Aksiyon butonu — sadece read-only modda görünür ── */}
                    {!isEditingGoal && (
                        <TouchableOpacity
                            style={styles.addUpdateBtn}
                            onPress={openAddUpdate}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.addUpdateBtnText}>+ Güncelleme Ekle</Text>
                        </TouchableOpacity>
                    )}

                    {/* ══════════════════════════════════════════
              BÖLÜM 2 — Gelişim Günlüğü
              (Her modda görünür; ana hedef formu ile çakışmaz)
          ══════════════════════════════════════════ */}
                    <Text style={styles.sectionTitle}>
                        📋 Gelişim Günlüğü
                        {goal.updates?.length > 0 && (
                            <Text style={styles.sectionCount}> ({goal.updates.length})</Text>
                        )}
                    </Text>

                    {/* Yeni güncelleme input kutusu */}
                    {updateInput.mode === 'add' && (
                        <View style={styles.updateInputCard}>
                            <Text style={styles.updateInputLabel}>Yeni Not</Text>
                            <TextInput
                                style={[styles.input, styles.textarea]}
                                value={updateInput.text}
                                onChangeText={t => setUpdateInput(prev => ({ ...prev, text: t }))}
                                placeholder="Bugün ne yaptınız? (örn: 5km koştum)"
                                placeholderTextColor={Colors.textLight}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                autoFocus
                                maxLength={500}
                            />
                            <View style={styles.updateInputActions}>
                                <TouchableOpacity
                                    style={[styles.inputActionBtn, styles.inputActionBtnOutline]}
                                    onPress={cancelUpdateInput}
                                >
                                    <Text style={styles.inputActionBtnOutlineText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.inputActionBtn, styles.inputActionBtnFill]}
                                    onPress={saveAddUpdate}
                                >
                                    <Text style={styles.inputActionBtnFillText}>Kaydet</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Mevcut güncellemeler listesi */}
                    {(!goal.updates || goal.updates.length === 0) && updateInput.mode !== 'add' ? (
                        <View style={styles.emptyUpdates}>
                            <Text style={styles.emptyUpdatesIcon}>📓</Text>
                            <Text style={styles.emptyUpdatesText}>Henüz güncelleme yok.</Text>
                            <Text style={styles.emptyUpdatesHint}>"Güncelleme Ekle" ile ilerlemenizi kaydedin.</Text>
                        </View>
                    ) : (
                        (goal.updates || []).map(upd => (
                            <View key={upd.id}>
                                {updateInput.mode === 'edit' && updateInput.id === upd.id ? (
                                    /* ── Satır içi düzenleme kutusu ── */
                                    <View style={styles.updateInputCard}>
                                        <Text style={styles.updateInputLabel}>Notu Düzenle</Text>
                                        <TextInput
                                            style={[styles.input, styles.textarea]}
                                            value={updateInput.text}
                                            onChangeText={t => setUpdateInput(prev => ({ ...prev, text: t }))}
                                            multiline
                                            numberOfLines={3}
                                            textAlignVertical="top"
                                            autoFocus
                                            maxLength={500}
                                        />
                                        <View style={styles.updateInputActions}>
                                            <TouchableOpacity
                                                style={[styles.inputActionBtn, styles.inputActionBtnOutline]}
                                                onPress={cancelUpdateInput}
                                            >
                                                <Text style={styles.inputActionBtnOutlineText}>İptal</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={[styles.inputActionBtn, styles.inputActionBtnFill]}
                                                onPress={saveEditUpdate}
                                            >
                                                <Text style={styles.inputActionBtnFillText}>Güncelle</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    /* ── Güncelleme kartı ── */
                                    <TouchableOpacity
                                        style={styles.updateCard}
                                        onPress={() => openEditUpdate(upd)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.updateCardHeader}>
                                            <Text style={styles.updateDate}>
                                                {new Date(upd.date).toLocaleDateString('tr-TR', {
                                                    day: 'numeric', month: 'long', year: 'numeric',
                                                })}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => confirmDeleteUpdate(upd.id)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                            >
                                                <Text style={styles.updateDeleteIcon}>🗑</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={styles.updateText}>{upd.text}</Text>
                                        <Text style={styles.updateEditHint}>Düzenlemek için dokun</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))
                    )}

                    <View style={{ height: 48 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'android' ? 48 : 56,
        paddingBottom: Spacing.md,
        backgroundColor: Colors.surface,
        borderBottomWidth: 3,
        ...Shadows.sm,
    },
    backBtn: {
        paddingRight: Spacing.sm,
        paddingVertical: 4,
        flexShrink: 0,
    },
    backBtnText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    topBarTitle: {
        flex: 1,
        fontSize: Typography.base,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
        marginHorizontal: Spacing.xs,
    },
    topActionBtn: {
        paddingLeft: Spacing.sm,
        paddingVertical: 4,
        flexShrink: 0,
    },
    topActionBtnText: {
        fontSize: Typography.sm,
        fontWeight: '600',
        color: Colors.accentDark,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: Spacing.lg,
        paddingTop: Spacing.md,
    },
    // ── Main card ───────────────────────────────────────────
    card: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: Colors.border,
        overflow: 'hidden',
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    cardStrip: { height: 4, width: '100%' },
    cardBody: { padding: Spacing.lg },
    // read-only
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
        flexWrap: 'wrap',
    },
    categoryBadge: {
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    categoryBadgeText: {
        fontSize: Typography.xs,
        fontWeight: '600',
        color: Colors.textMuted,
    },
    doneBadge: {
        backgroundColor: Colors.successSoft,
        borderRadius: Radii.full,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
    },
    doneBadgeText: {
        fontSize: Typography.xs,
        fontWeight: '700',
        color: '#2E8B44',
    },
    goalName: {
        fontSize: Typography.lg,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
        lineHeight: 28,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    infoLabel: { fontSize: Typography.sm, color: Colors.textMuted, fontWeight: '500' },
    infoValue: { fontSize: Typography.sm, fontWeight: '700', color: Colors.text },
    noteBox: {
        marginTop: Spacing.md,
        backgroundColor: Colors.bg,
        borderRadius: Radii.sm,
        padding: Spacing.md,
        borderLeftWidth: 3,
        borderLeftColor: Colors.accent,
    },
    noteLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    noteText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
    // ── form fields ─────────────────────────────────────────
    formSectionTitle: {
        fontSize: Typography.sm,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.md,
    },
    fieldLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.xs,
        marginTop: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        fontSize: Typography.base,
        color: Colors.text,
        backgroundColor: Colors.surface,
    },
    textarea: {
        minHeight: 72,
        paddingTop: Spacing.sm,
        textAlignVertical: 'top',
    },
    categoryScroll: { gap: Spacing.xs, paddingVertical: 4 },
    catChip: {
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: Spacing.xs + 2,
        borderRadius: Radii.full,
        backgroundColor: Colors.surface2,
        borderWidth: 1,
        borderColor: Colors.border,
        marginRight: Spacing.xs,
    },
    catChipActive: { backgroundColor: Colors.accentBg, borderColor: Colors.accentDark },
    catChipText: { fontSize: Typography.sm, fontWeight: '500', color: Colors.textMuted },
    catChipTextActive: { fontWeight: '700', color: '#5A4800' },
    toggle: {
        flexDirection: 'row',
        backgroundColor: Colors.bg,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        padding: 4,
        alignSelf: 'flex-start',
        gap: 4,
        marginBottom: Spacing.sm,
    },
    toggleBtn: {
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: Radii.sm - 2,
    },
    toggleBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
    toggleBtnText: { fontSize: Typography.sm, fontWeight: '500', color: Colors.textMuted },
    toggleBtnTextActive: { fontWeight: '700', color: Colors.text },
    dateTrigger: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: Radii.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        backgroundColor: Colors.surface,
        marginBottom: Spacing.sm,
    },
    dateTriggerText: { fontSize: Typography.base, color: Colors.text },
    dateTriggerArrow: { fontSize: 12, color: Colors.textMuted },
    daysRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    daysUnit: { fontSize: Typography.base, fontWeight: '500', color: Colors.textMuted },
    saveBtn: {
        marginTop: Spacing.md,
        backgroundColor: Colors.accent,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.md,
        alignItems: 'center',
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 2,
    },
    saveBtnText: { fontSize: Typography.base - 1, fontWeight: '700', color: '#5A4800' },
    // ── Add update button ─────────────────────────────────────
    addUpdateBtn: {
        backgroundColor: Colors.accent,
        paddingVertical: Spacing.sm + 4,
        borderRadius: Radii.md,
        alignItems: 'center',
        marginBottom: Spacing.lg,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 2,
    },
    addUpdateBtnText: { fontSize: Typography.base - 1, fontWeight: '700', color: '#5A4800' },
    // ── Section title ─────────────────────────────────────────
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: Spacing.md,
    },
    sectionCount: { fontWeight: '400', color: Colors.textMuted },
    // ── Empty state ───────────────────────────────────────────
    emptyUpdates: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        borderStyle: 'dashed',
    },
    emptyUpdatesIcon: { fontSize: 32, marginBottom: Spacing.sm },
    emptyUpdatesText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
    emptyUpdatesHint: { fontSize: Typography.xs, color: Colors.textLight, marginTop: 4 },
    // ── Update input card ─────────────────────────────────────
    updateInputCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1.5,
        borderColor: Colors.accentDark,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    updateInputLabel: {
        fontSize: Typography.xs,
        fontWeight: '700',
        color: Colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        marginBottom: Spacing.xs,
    },
    updateInputActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    inputActionBtn: {
        flex: 1,
        paddingVertical: Spacing.sm + 2,
        borderRadius: Radii.md,
        alignItems: 'center',
    },
    inputActionBtnOutline: {
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: Colors.surface,
    },
    inputActionBtnOutlineText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textMuted },
    inputActionBtnFill: {
        flex: 2,
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    inputActionBtnFillText: { fontSize: Typography.sm, fontWeight: '700', color: '#5A4800' },
    // ── Update card ───────────────────────────────────────────
    updateCard: {
        backgroundColor: Colors.surface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        ...Shadows.sm,
    },
    updateCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    updateDate: { fontSize: Typography.xs, color: Colors.textLight, fontWeight: '500' },
    updateDeleteIcon: { fontSize: 14 },
    updateText: { fontSize: Typography.sm, color: Colors.text, lineHeight: 20 },
    updateEditHint: { fontSize: 10, color: Colors.textLight, marginTop: 6, fontStyle: 'italic' },
});
