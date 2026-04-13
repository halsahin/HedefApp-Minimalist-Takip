import React, { useState, useRef, useEffect } from 'react';
import {
    Modal, View, Text, TextInput, TouchableOpacity,
    ScrollView, StyleSheet, Platform, KeyboardAvoidingView, Keyboard, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { CATEGORIES, CATEGORY_ICON_MAP, getCategoryLabel } from '../constants/categories';
import { calcRemainingDays, formatDate, deadlineFromDays } from '../utils/dateUtils';
import { addGoalToCalendar } from '../utils/calendar';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const PROGRESS_OPTIONS = [0, 25, 50, 75, 100];
const REMINDER_OPTIONS = [7, 3, 1, 0];

export default function GoalDetailModal({
    goal, visible, onClose,
    onUpdateGoal, onAddUpdate, onEditUpdate, onDeleteUpdate,
    onAddSubtask, onToggleSubtask, onDeleteSubtask,
}) {
    const { t, locale } = useLanguage();
    const { colors, isDark } = useTheme();

    const [isEditingGoal, setIsEditingGoal] = useState(false);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editDeadlineMode, setEditDeadlineMode] = useState('date');
    const [editDate, setEditDate] = useState(new Date());
    const [editDays, setEditDays] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editProgress, setEditProgress] = useState(0);
    const [editReminderDays, setEditReminderDays] = useState([3, 1]);
    const [editRecurring, setEditRecurring] = useState(null);
    const [customReminderInput, setCustomReminderInput] = useState('');
    const [showDatePicker, setShowDatePicker] = useState(false);

    const [updateInput, setUpdateInput] = useState({ mode: 'none', id: null, text: '' });
    const [subtaskInput, setSubtaskInput] = useState('');

    const scrollRef = useRef(null);

    useEffect(() => {
        if (visible && goal) {
            setIsEditingGoal(false);
            setUpdateInput({ mode: 'none', id: null, text: '' });
            setSubtaskInput('');
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
        setEditProgress(g.progress || 0);
        setEditReminderDays(g.reminderDays ?? [3, 1]);
        setEditRecurring(g.recurring ?? null);
        setCustomReminderInput('');
    }

    function saveGoalEdit() {
        if (!editName.trim()) return;
        let deadline;
        if (editDeadlineMode === 'date') {
            deadline = [editDate.getFullYear(), String(editDate.getMonth() + 1).padStart(2, '0'), String(editDate.getDate()).padStart(2, '0')].join('-');
        } else {
            const d = parseInt(editDays, 10);
            if (isNaN(d) || d < 1) return;
            deadline = deadlineFromDays(d);
        }
        onUpdateGoal(goal.id, { name: editName, category: editCategory, deadline, description: editDesc, progress: editProgress, reminderDays: editReminderDays, recurring: editRecurring });
        setIsEditingGoal(false);
        Keyboard.dismiss();
    }

    function cancelGoalEdit() {
        const hasChanges = editName.trim() !== goal.name ||
            editCategory !== goal.category ||
            editDesc !== (goal.description || '') ||
            editProgress !== (goal.progress || 0);
        if (hasChanges) {
            Alert.alert(
                t('detail.cancel'),
                t('detail.discardChanges') || 'Değişiklikler kaydedilmeyecek. Devam edilsin mi?',
                [
                    { text: t('detail.cancel'), style: 'cancel' },
                    {
                        text: t('detail.discard') || 'Vazgeç',
                        style: 'destructive',
                        onPress: () => { setIsEditingGoal(false); setShowDatePicker(false); Keyboard.dismiss(); },
                    },
                ]
            );
        } else {
            setIsEditingGoal(false);
            setShowDatePicker(false);
            Keyboard.dismiss();
        }
    }

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
        Alert.alert(t('detail.deleteTitle'), t('detail.deleteMsg'), [
            { text: t('detail.cancel'), style: 'cancel' },
            { text: t('detail.delete'), style: 'destructive', onPress: () => onDeleteUpdate(goal.id, updateId) },
        ]);
    }

    function handleAddSubtask() {
        if (!subtaskInput.trim()) return;
        onAddSubtask(goal.id, subtaskInput);
        setSubtaskInput('');
    }

    if (!goal) return null;

    const days = calcRemainingDays(goal.deadline);
    const overdue = !goal.completed && days < 0;
    const icon = CATEGORY_ICON_MAP[goal.category] || '📌';
    const stripColor = goal.completed ? colors.success : goal.pinned ? colors.accentDark : overdue ? colors.danger : colors.accent;
    const formattedEditDate = editDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });

    // Timeline
    const hasTimeline = !!(goal.startDate && !goal.completed);
    let timelineProgress = 0;
    if (hasTimeline) {
        const start = new Date(goal.startDate + 'T00:00:00').getTime();
        const end = new Date(goal.deadline + 'T00:00:00').getTime();
        const now = Date.now();
        timelineProgress = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

                {/* Top bar */}
                <View style={[styles.topBar, { borderBottomColor: stripColor, backgroundColor: colors.surface }]}>
                    <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
                        <Text style={[styles.backBtnText, { color: colors.textMuted }]}>{t('detail.back')}</Text>
                    </TouchableOpacity>
                    <Text style={[styles.topBarTitle, { color: colors.text }]} numberOfLines={1}>{goal.name}</Text>
                    {isEditingGoal ? (
                        <TouchableOpacity style={styles.topActionBtn} onPress={cancelGoalEdit} activeOpacity={0.7}>
                            <Text style={[styles.topActionBtnText, { color: colors.textMuted }]}>{t('detail.cancel')}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.topActionBtn} onPress={() => { populateEditForm(goal); setIsEditingGoal(true); }} activeOpacity={0.7}>
                            <Text style={[styles.topActionBtnText, { color: colors.accentDark }]}>{t('detail.edit')}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

                    {/* Main card */}
                    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[styles.cardStrip, { backgroundColor: stripColor }]} />
                        <View style={styles.cardBody}>
                            {isEditingGoal ? (
                                <>
                                    <Text style={[styles.formSectionTitle, { color: colors.textMuted }]}>{t('detail.editTitle')}</Text>

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('detail.goalName')}</Text>
                                    <TextInput
                                        style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                        value={editName}
                                        onChangeText={setEditName}
                                        placeholder={t('detail.goalNamePlaceholder')}
                                        placeholderTextColor={colors.textLight}
                                        maxLength={100}
                                    />

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('detail.category')}</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll} keyboardShouldPersistTaps="handled">
                                        {CATEGORIES.map(cat => {
                                            const active = editCategory === cat.key;
                                            return (
                                                <TouchableOpacity
                                                    key={cat.key}
                                                    style={[styles.catChip,
                                                        { backgroundColor: colors.surface2, borderColor: colors.border },
                                                        active && { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                                                    ]}
                                                    onPress={() => setEditCategory(cat.key)}
                                                    activeOpacity={0.75}
                                                >
                                                    <Text style={[styles.catChipText, { color: colors.textMuted },
                                                        active && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' }
                                                    ]}>
                                                        {cat.icon} {t(`cat.${cat.key}`)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('detail.deadline')}</Text>
                                    <View style={[styles.toggle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                        {['date', 'days'].map(m => (
                                            <TouchableOpacity
                                                key={m}
                                                style={[styles.toggleBtn, editDeadlineMode === m && [styles.toggleBtnActive, { backgroundColor: colors.surface }]]}
                                                onPress={() => { setEditDeadlineMode(m); setShowDatePicker(false); }}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.toggleBtnText, { color: colors.textMuted },
                                                    editDeadlineMode === m && { fontWeight: '700', color: colors.text }
                                                ]}>
                                                    {m === 'date' ? t('detail.pickDate') : t('detail.countDays')}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {editDeadlineMode === 'date' && (
                                        <>
                                            <TouchableOpacity
                                                style={[styles.dateTrigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
                                                onPress={() => setShowDatePicker(v => !v)}
                                                activeOpacity={0.8}
                                            >
                                                <Text style={[styles.dateTriggerText, { color: colors.text }]}>📅 {formattedEditDate}</Text>
                                                <Text style={[styles.dateTriggerArrow, { color: colors.textMuted }]}>{showDatePicker ? '▴' : '▾'}</Text>
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
                                        <View style={[styles.daysRow, { marginBottom: Spacing.sm }]}>
                                            <TextInput
                                                style={[styles.input, { flex: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                                placeholder={t('detail.exDays')}
                                                placeholderTextColor={colors.textLight}
                                                value={editDays}
                                                onChangeText={setEditDays}
                                                keyboardType="numeric"
                                                maxLength={4}
                                            />
                                            <Text style={[styles.daysUnit, { color: colors.textMuted }]}>{t('detail.daysUnit')}</Text>
                                        </View>
                                    )}

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('detail.progress')}</Text>
                                    <View style={styles.progressBtns}>
                                        {PROGRESS_OPTIONS.map(p => (
                                            <TouchableOpacity
                                                key={p}
                                                style={[styles.progressBtn,
                                                    { borderColor: colors.border, backgroundColor: colors.surface2 },
                                                    editProgress === p && { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                                                ]}
                                                onPress={() => setEditProgress(p)}
                                                activeOpacity={0.75}
                                            >
                                                <Text style={[styles.progressBtnText, { color: colors.textMuted },
                                                    editProgress === p && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' }
                                                ]}>{p}%</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('reminder.label')}</Text>
                                    <View style={styles.reminderChips}>
                                        {REMINDER_OPTIONS.map(days => {
                                            const active = editReminderDays.includes(days);
                                            return (
                                                <TouchableOpacity
                                                    key={days}
                                                    style={[styles.reminderChip,
                                                        { backgroundColor: active ? colors.accentBg : colors.surface2, borderColor: active ? colors.accentDark : colors.border }
                                                    ]}
                                                    onPress={() => setEditReminderDays(prev =>
                                                        prev.includes(days) ? prev.filter(d => d !== days) : [...prev, days]
                                                    )}
                                                    activeOpacity={0.75}
                                                >
                                                    <Text style={[styles.reminderChipText, { color: active ? (isDark ? colors.accent : '#5A4800') : colors.textMuted },
                                                        active && { fontWeight: '700' }
                                                    ]}>
                                                        {t(`reminder.${days}`)}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                        {editReminderDays.filter(d => !REMINDER_OPTIONS.includes(d)).map(days => (
                                            <TouchableOpacity
                                                key={days}
                                                style={[styles.reminderChip, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                                onPress={() => setEditReminderDays(prev => prev.filter(d => d !== days))}
                                                activeOpacity={0.75}
                                            >
                                                <Text style={[styles.reminderChipText, { color: isDark ? colors.accent : '#5A4800', fontWeight: '700' }]}>
                                                    {t('reminder.custom', { n: days })} ✕
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                    <View style={styles.reminderCustomRow}>
                                        <TextInput
                                            style={[styles.input, styles.reminderCustomInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                            placeholder={t('reminder.customPlaceholder')}
                                            placeholderTextColor={colors.textLight}
                                            value={customReminderInput}
                                            onChangeText={setCustomReminderInput}
                                            keyboardType="numeric"
                                            maxLength={3}
                                            returnKeyType="done"
                                            onSubmitEditing={() => {
                                                const n = parseInt(customReminderInput, 10);
                                                if (!isNaN(n) && n > 0 && !editReminderDays.includes(n)) {
                                                    setEditReminderDays(prev => [...prev, n]);
                                                }
                                                setCustomReminderInput('');
                                            }}
                                        />
                                        <TouchableOpacity
                                            style={[styles.reminderAddBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                            onPress={() => {
                                                const n = parseInt(customReminderInput, 10);
                                                if (!isNaN(n) && n > 0 && !editReminderDays.includes(n)) {
                                                    setEditReminderDays(prev => [...prev, n]);
                                                }
                                                setCustomReminderInput('');
                                            }}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={{ color: isDark ? colors.accent : '#5A4800', fontWeight: '700', fontSize: 18 }}>+</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{t('detail.notesOptional')}</Text>
                                    <TextInput
                                        style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                        value={editDesc}
                                        onChangeText={setEditDesc}
                                        placeholder={t('detail.shortNote')}
                                        placeholderTextColor={colors.textLight}
                                        multiline
                                        numberOfLines={3}
                                        maxLength={300}
                                        textAlignVertical="top"
                                    />

                                    <TouchableOpacity style={styles.saveBtn} onPress={saveGoalEdit} activeOpacity={0.8}>
                                        <Text style={styles.saveBtnText}>{t('detail.save')}</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <View style={styles.categoryRow}>
                                        <View style={[styles.categoryBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                                            <Text style={[styles.categoryBadgeText, { color: colors.textMuted }]}>
                                                {icon} {getCategoryLabel(goal.category, t)}
                                            </Text>
                                        </View>
                                        {goal.completed && (
                                            <View style={[styles.doneBadge, { backgroundColor: colors.successSoft }]}>
                                                <Text style={[styles.doneBadgeText, { color: colors.success }]}>{t('detail.completed')}</Text>
                                            </View>
                                        )}
                                        {goal.recurring && (
                                            <View style={[styles.doneBadge, { backgroundColor: colors.accentBg }]}>
                                                <Text style={[styles.doneBadgeText, { color: isDark ? colors.accent : '#5A4800' }]}>🔁 {t('detail.recurring')}</Text>
                                            </View>
                                        )}
                                    </View>

                                    <Text style={[styles.goalName, { color: colors.text }]}>{goal.name}</Text>

                                    {/* Progress bar */}
                                    {!goal.completed && goal.progress > 0 && (
                                        <View style={styles.progressSection}>
                                            <View style={styles.progressLabelRow}>
                                                <Text style={[styles.progressLabelText, { color: colors.textMuted }]}>{t('detail.progress')}</Text>
                                                <Text style={[styles.progressLabelText, { color: colors.success, fontWeight: '700' }]}>{goal.progress}%</Text>
                                            </View>
                                            <View style={[styles.progressBgBig, { backgroundColor: colors.border }]}>
                                                <View style={[styles.progressFillBig, { width: `${goal.progress}%`, backgroundColor: colors.success }]} />
                                            </View>
                                        </View>
                                    )}

                                    {/* Timeline */}
                                    {hasTimeline && (
                                        <View style={[styles.timelineBox, { borderColor: colors.border, backgroundColor: colors.bg }]}>
                                            <Text style={[styles.timelineLabelTop, { color: colors.textMuted }]}>{t('detail.timeline')}</Text>
                                            <View style={styles.timelineRow}>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(goal.startDate, locale)}</Text>
                                                <View style={[styles.timelineLine, { backgroundColor: colors.border }]}>
                                                    <View style={[styles.timelineToday, { left: `${timelineProgress}%`, backgroundColor: colors.accentDark }]} />
                                                </View>
                                                <Text style={[styles.timelineDate, { color: colors.textMuted }]}>{formatDate(goal.deadline, locale)}</Text>
                                            </View>
                                        </View>
                                    )}

                                    {goal.startDate && (
                                        <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('detail.startDate')}</Text>
                                            <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(goal.startDate, locale)}</Text>
                                        </View>
                                    )}

                                    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('detail.deadlineLabel')}</Text>
                                        <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(goal.deadline, locale)}</Text>
                                    </View>

                                    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t('detail.remaining')}</Text>
                                        <Text style={[styles.infoValue, { color: colors.text },
                                            overdue && { color: colors.danger },
                                            goal.completed && { color: colors.success },
                                        ]}>
                                            {goal.completed
                                                ? t('detail.completedValue')
                                                : overdue
                                                    ? t('detail.daysAgo', { n: Math.abs(days) })
                                                    : t('detail.daysLeft', { n: days })}
                                        </Text>
                                    </View>

                                    {/* Takvime Ekle */}
                                    {!goal.completed && (
                                        <TouchableOpacity
                                            style={[styles.calendarBtn, { borderColor: colors.border, backgroundColor: colors.bg }]}
                                            activeOpacity={0.75}
                                            onPress={async () => {
                                                const result = await addGoalToCalendar(goal);
                                                if (result === 'ok') {
                                                    Alert.alert('📅', t('calendar.addedToCalendar'));
                                                } else if (result === 'denied') {
                                                    Alert.alert('', t('calendar.calendarDenied'));
                                                } else if (result === 'unavailable') {
                                                    Alert.alert('', t('calendar.calendarUnavailable'));
                                                } else {
                                                    Alert.alert('', t('calendar.calendarError'));
                                                }
                                            }}
                                        >
                                            <Text style={[styles.calendarBtnText, { color: colors.textMuted }]}>
                                                {t('calendar.addToCalendar')}
                                            </Text>
                                        </TouchableOpacity>
                                    )}

                                    {!!goal.description && (
                                        <View style={[styles.noteBox, { backgroundColor: colors.bg, borderLeftColor: colors.accent }]}>
                                            <Text style={[styles.noteLabel, { color: colors.textMuted }]}>{t('detail.notes')}</Text>
                                            <Text style={[styles.noteText, { color: colors.text }]}>{goal.description}</Text>
                                        </View>
                                    )}
                                </>
                            )}
                        </View>
                    </View>

                    {/* Subtasks section */}
                    {!isEditingGoal && (
                        <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('detail.subtasks')}</Text>

                            {(!goal.subtasks || goal.subtasks.length === 0) && (
                                <Text style={[styles.emptyHint, { color: colors.textLight }]}>{t('detail.noSubtasks')}</Text>
                            )}

                            {(goal.subtasks || []).map(s => (
                                <View key={s.id} style={[styles.subtaskRow, { borderBottomColor: colors.border }]}>
                                    <TouchableOpacity
                                        style={[styles.subtaskCheck, s.completed && { backgroundColor: colors.success, borderColor: colors.success }]}
                                        onPress={() => onToggleSubtask(goal.id, s.id)}
                                        activeOpacity={0.7}
                                    >
                                        {s.completed && <Text style={styles.subtaskCheckMark}>✓</Text>}
                                    </TouchableOpacity>
                                    <Text style={[styles.subtaskText, { color: s.completed ? colors.textMuted : colors.text },
                                        s.completed && { textDecorationLine: 'line-through' }
                                    ]}>{s.text}</Text>
                                    <TouchableOpacity onPress={() => onDeleteSubtask(goal.id, s.id)} activeOpacity={0.7}>
                                        <Text style={{ color: colors.danger, fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <View style={styles.subtaskInputRow}>
                                <TextInput
                                    style={[styles.subtaskInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.bg }]}
                                    value={subtaskInput}
                                    onChangeText={setSubtaskInput}
                                    placeholder={t('detail.subtaskPlaceholder')}
                                    placeholderTextColor={colors.textLight}
                                    onSubmitEditing={handleAddSubtask}
                                    returnKeyType="done"
                                />
                                <TouchableOpacity
                                    style={[styles.addSubBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                                    onPress={handleAddSubtask}
                                    activeOpacity={0.75}
                                >
                                    <Text style={{ color: isDark ? colors.accent : '#5A4800', fontWeight: '700', fontSize: 18 }}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Add update button */}
                    {!isEditingGoal && (
                        <TouchableOpacity style={styles.addUpdateBtn} onPress={openAddUpdate} activeOpacity={0.8}>
                            <Text style={styles.addUpdateBtnText}>{t('detail.addUpdate')}</Text>
                        </TouchableOpacity>
                    )}

                    <Text style={[styles.sectionTitle, { color: colors.text, marginHorizontal: 0 }]}>
                        {t('detail.progressLog')}
                        {goal.updates?.length > 0 && (
                            <Text style={[styles.sectionCount, { color: colors.textMuted }]}> ({goal.updates.length})</Text>
                        )}
                    </Text>

                    {updateInput.mode === 'add' && (
                        <View style={[styles.updateInputCard, { backgroundColor: colors.surface, borderColor: colors.accentDark }]}>
                            <Text style={[styles.updateInputLabel, { color: colors.textMuted }]}>{t('detail.newNote')}</Text>
                            <TextInput
                                style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                value={updateInput.text}
                                onChangeText={txt => setUpdateInput(prev => ({ ...prev, text: txt }))}
                                placeholder={t('detail.placeholder.update')}
                                placeholderTextColor={colors.textLight}
                                multiline numberOfLines={3} textAlignVertical="top" autoFocus maxLength={500}
                            />
                            <View style={styles.updateInputActions}>
                                <TouchableOpacity style={[styles.inputActionBtn, { borderWidth: 1, borderColor: colors.border }]} onPress={cancelUpdateInput}>
                                    <Text style={[styles.inputActionBtnOutlineText, { color: colors.textMuted }]}>{t('detail.cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.inputActionBtn, styles.inputActionBtnFill]} onPress={saveAddUpdate}>
                                    <Text style={styles.inputActionBtnFillText}>{t('detail.save2')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {(!goal.updates || goal.updates.length === 0) && updateInput.mode !== 'add' ? (
                        <View style={[styles.emptyUpdates, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={styles.emptyUpdatesIcon}>📓</Text>
                            <Text style={[styles.emptyUpdatesText, { color: colors.textMuted }]}>{t('detail.emptyUpdates')}</Text>
                            <Text style={[styles.emptyUpdatesHint, { color: colors.textLight }]}>{t('detail.emptyHint')}</Text>
                        </View>
                    ) : (
                        (goal.updates || []).map(upd => (
                            <View key={upd.id}>
                                {updateInput.mode === 'edit' && updateInput.id === upd.id ? (
                                    <View style={[styles.updateInputCard, { backgroundColor: colors.surface, borderColor: colors.accentDark }]}>
                                        <Text style={[styles.updateInputLabel, { color: colors.textMuted }]}>{t('detail.editNote')}</Text>
                                        <TextInput
                                            style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                                            value={updateInput.text}
                                            onChangeText={txt => setUpdateInput(prev => ({ ...prev, text: txt }))}
                                            multiline numberOfLines={3} textAlignVertical="top" autoFocus maxLength={500}
                                        />
                                        <View style={styles.updateInputActions}>
                                            <TouchableOpacity style={[styles.inputActionBtn, { borderWidth: 1, borderColor: colors.border }]} onPress={cancelUpdateInput}>
                                                <Text style={[styles.inputActionBtnOutlineText, { color: colors.textMuted }]}>{t('detail.cancel')}</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity style={[styles.inputActionBtn, styles.inputActionBtnFill]} onPress={saveEditUpdate}>
                                                <Text style={styles.inputActionBtnFillText}>{t('detail.update')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        style={[styles.updateCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={() => openEditUpdate(upd)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.updateCardHeader}>
                                            <Text style={[styles.updateDate, { color: colors.textLight }]}>
                                                {new Date(upd.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </Text>
                                            <TouchableOpacity onPress={() => confirmDeleteUpdate(upd.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                                <Text style={styles.updateDeleteIcon}>🗑</Text>
                                            </TouchableOpacity>
                                        </View>
                                        <Text style={[styles.updateText, { color: colors.text }]}>{upd.text}</Text>
                                        <Text style={[styles.updateEditHint, { color: colors.textLight }]}>{t('detail.editHint')}</Text>
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

const styles = StyleSheet.create({
    root: { flex: 1 },
    topBar: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Platform.OS === 'android' ? 48 : 56,
        paddingBottom: Spacing.md,
        borderBottomWidth: 3,
        ...Shadows.sm,
    },
    backBtn: { paddingRight: Spacing.sm, paddingVertical: 4, flexShrink: 0 },
    backBtnText: { fontSize: Typography.sm, fontWeight: '600' },
    topBarTitle: { flex: 1, fontSize: Typography.base, fontWeight: '700', textAlign: 'center', marginHorizontal: Spacing.xs },
    topActionBtn: { paddingLeft: Spacing.sm, paddingVertical: 4, flexShrink: 0 },
    topActionBtnText: { fontSize: Typography.sm, fontWeight: '600' },
    scroll: { flex: 1 },
    scrollContent: { padding: Spacing.lg, paddingTop: Spacing.md },
    card: { borderRadius: Radii.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.md, ...Shadows.sm },
    cardStrip: { height: 4, width: '100%' },
    cardBody: { padding: Spacing.lg },
    categoryRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.sm, flexWrap: 'wrap' },
    categoryBadge: { borderWidth: 1, borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    categoryBadgeText: { fontSize: Typography.xs, fontWeight: '600' },
    doneBadge: { borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 3 },
    doneBadgeText: { fontSize: Typography.xs, fontWeight: '700' },
    goalName: { fontSize: Typography.lg, fontWeight: '700', marginBottom: Spacing.md, lineHeight: 28 },
    progressSection: { marginBottom: Spacing.md },
    progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabelText: { fontSize: Typography.sm },
    progressBgBig: { height: 8, borderRadius: Radii.full, overflow: 'hidden' },
    progressFillBig: { height: '100%', borderRadius: Radii.full },
    timelineBox: { borderWidth: 1, borderRadius: Radii.sm, padding: Spacing.sm, marginBottom: Spacing.sm },
    timelineLabelTop: { fontSize: Typography.xs, fontWeight: '600', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.6 },
    timelineRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
    timelineDate: { fontSize: 9, flexShrink: 0, maxWidth: 60, textAlign: 'center' },
    timelineLine: { flex: 1, height: 4, borderRadius: Radii.full, position: 'relative', overflow: 'visible' },
    timelineToday: { position: 'absolute', top: -4, width: 12, height: 12, borderRadius: 6, marginLeft: -6 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1 },
    infoLabel: { fontSize: Typography.sm, fontWeight: '500' },
    infoValue: { fontSize: Typography.sm, fontWeight: '700' },
    calendarBtn: {
        marginTop: Spacing.md,
        borderWidth: 1,
        borderRadius: Radii.sm,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
    },
    calendarBtnText: { fontSize: Typography.sm, fontWeight: '600' },
    noteBox: { marginTop: Spacing.md, borderRadius: Radii.sm, padding: Spacing.md, borderLeftWidth: 3 },
    noteLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 },
    noteText: { fontSize: Typography.sm, lineHeight: 20 },
    formSectionTitle: { fontSize: Typography.sm, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.md },
    fieldLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.sm },
    input: { borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.base },
    textarea: { minHeight: 72, paddingTop: Spacing.sm, textAlignVertical: 'top' },
    categoryScroll: { gap: Spacing.xs, paddingVertical: 4 },
    catChip: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2, borderRadius: Radii.full, borderWidth: 1, marginRight: Spacing.xs },
    catChipText: { fontSize: Typography.sm, fontWeight: '500' },
    toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: Radii.sm, padding: 4, alignSelf: 'flex-start', gap: 4, marginBottom: Spacing.sm },
    toggleBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.sm - 2 },
    toggleBtnActive: { ...Shadows.sm },
    toggleBtnText: { fontSize: Typography.sm, fontWeight: '500' },
    dateTrigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, marginBottom: Spacing.sm },
    dateTriggerText: { fontSize: Typography.base },
    dateTriggerArrow: { fontSize: 12 },
    daysRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    daysUnit: { fontSize: Typography.base, fontWeight: '500' },
    progressBtns: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap', marginBottom: Spacing.sm },
    progressBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full, borderWidth: 1 },
    progressBtnText: { fontSize: Typography.sm, fontWeight: '500' },
    saveBtn: { marginTop: Spacing.md, backgroundColor: '#F9E55A', paddingVertical: Spacing.sm + 4, borderRadius: Radii.md, alignItems: 'center', shadowColor: '#F9E55A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 2 },
    saveBtnText: { fontSize: Typography.base - 1, fontWeight: '700', color: '#5A4800' },
    sectionCard: { borderRadius: Radii.md, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
    sectionTitle: { fontSize: Typography.base, fontWeight: '700', marginBottom: Spacing.md },
    sectionCount: { fontWeight: '400' },
    emptyHint: { fontSize: Typography.sm, marginBottom: Spacing.sm },
    subtaskRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1 },
    subtaskCheck: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#C0C0D0', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    subtaskCheckMark: { color: '#fff', fontSize: 11, fontWeight: '700' },
    subtaskText: { flex: 1, fontSize: Typography.sm },
    subtaskInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
    subtaskInput: { flex: 1, borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.sm },
    addSubBtn: { borderWidth: 1, borderRadius: Radii.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    addUpdateBtn: { backgroundColor: '#F9E55A', paddingVertical: Spacing.sm + 4, borderRadius: Radii.md, alignItems: 'center', marginBottom: Spacing.lg, shadowColor: '#F9E55A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 2 },
    addUpdateBtnText: { fontSize: Typography.base - 1, fontWeight: '700', color: '#5A4800' },
    emptyUpdates: { alignItems: 'center', paddingVertical: Spacing.xl, borderRadius: Radii.md, borderWidth: 1, borderStyle: 'dashed' },
    emptyUpdatesIcon: { fontSize: 32, marginBottom: Spacing.sm },
    emptyUpdatesText: { fontSize: Typography.sm, fontWeight: '600' },
    emptyUpdatesHint: { fontSize: Typography.xs, marginTop: 4 },
    updateInputCard: { borderRadius: Radii.md, borderWidth: 1.5, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
    updateInputLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: Spacing.xs },
    updateInputActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
    inputActionBtn: { flex: 1, paddingVertical: Spacing.sm + 2, borderRadius: Radii.md, alignItems: 'center' },
    inputActionBtnOutlineText: { fontSize: Typography.sm, fontWeight: '600' },
    inputActionBtnFill: { flex: 2, backgroundColor: '#F9E55A', shadowColor: '#F9E55A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 2 },
    inputActionBtnFillText: { fontSize: Typography.sm, fontWeight: '700', color: '#5A4800' },
    reminderChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
    reminderChip: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2, borderRadius: Radii.full, borderWidth: 1 },
    reminderChipText: { fontSize: Typography.sm, fontWeight: '500' },
    reminderCustomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
    reminderCustomInput: { flex: 1 },
    reminderAddBtn: { borderWidth: 1, borderRadius: Radii.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    updateCard: { borderRadius: Radii.md, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.sm, ...Shadows.sm },
    updateCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    updateDate: { fontSize: Typography.xs, fontWeight: '500' },
    updateDeleteIcon: { fontSize: 14 },
    updateText: { fontSize: Typography.sm, lineHeight: 20 },
    updateEditHint: { fontSize: 10, marginTop: 6, fontStyle: 'italic' },
});
