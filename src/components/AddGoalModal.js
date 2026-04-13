import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Keyboard, Platform,
  KeyboardAvoidingView, Animated, PanResponder, useWindowDimensions, Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { CATEGORIES } from '../constants/categories';
import { defaultDeadline, deadlineFromDays, generateId } from '../utils/dateUtils';
import { useLanguage } from '../i18n/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const SWIPE_CLOSE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

const PROGRESS_OPTIONS = [0, 25, 50, 75, 100];
const RECURRING_TYPES = ['daily', 'weekly', 'monthly', 'custom'];
const REMINDER_OPTIONS = [7, 3, 1, 0];

export default function AddGoalModal({ visible, onClose, onSubmit }) {
  const { t, locale } = useLanguage();
  const { colors, isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();

  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [deadlineMode, setDeadlineMode] = useState('date');
  const [selectedDate, setSelectedDate] = useState(new Date(defaultDeadline() + 'T12:00:00'));
  const [daysInput, setDaysInput] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // New fields
  const [startDate, setStartDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [progress, setProgress] = useState(0);
  const [goalType, setGoalType] = useState('once'); // 'once' | 'recurring'
  const [recurringType, setRecurringType] = useState('weekly');
  const [recurringInterval, setRecurringInterval] = useState('7');
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');
  const [reminderDays, setReminderDays] = useState([3, 1]);
  const [customReminderInput, setCustomReminderInput] = useState('');

  const nameRef = useRef(null);
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      setCategory(CATEGORIES[0].key);
      setDeadlineMode('date');
      setSelectedDate(new Date(defaultDeadline() + 'T12:00:00'));
      setDaysInput('');
      setDescription('');
      setNameError(false);
      setShowDatePicker(false);
      setStartDate(null);
      setShowStartDatePicker(false);
      setProgress(0);
      setGoalType('once');
      setRecurringType('weekly');
      setRecurringInterval('7');
      setSubtasks([]);
      setSubtaskInput('');
      setReminderDays([3, 1]);
      setCustomReminderInput('');
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start(() => {
        setTimeout(() => nameRef.current?.focus(), 200);
      });
    }
  }, [visible]);

  function animatedClose() {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponderCapture: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => { if (g.dy > 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy > SWIPE_CLOSE_THRESHOLD || g.vy > SWIPE_VELOCITY_THRESHOLD) {
          animatedClose();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }).start();
        }
      },
    })
  ).current;

  function handleSubmit() {
    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }
    let deadline;
    let recurring = null;

    if (goalType === 'once') {
      if (deadlineMode === 'date') {
        deadline = [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0'),
        ].join('-');
      } else {
        const d = parseInt(daysInput, 10);
        if (isNaN(d) || d < 1) return;
        deadline = deadlineFromDays(d);
      }
    } else {
      // Recurring: auto-calculate first deadline based on interval
      const interval =
        recurringType === 'daily'   ? 1  :
        recurringType === 'weekly'  ? 7  :
        recurringType === 'monthly' ? 30 :
        (Number(recurringInterval) || 7);
      deadline = deadlineFromDays(interval);
      recurring = { type: recurringType, interval };
    }
    const startDateStr = startDate
      ? [startDate.getFullYear(), String(startDate.getMonth() + 1).padStart(2, '0'), String(startDate.getDate()).padStart(2, '0')].join('-')
      : null;
    onSubmit({ name, category, deadline, description, startDate: startDateStr, progress, recurring, subtasks, reminderDays });
    animatedClose();
  }

  function addSubtask() {
    if (!subtaskInput.trim()) return;
    setSubtasks(prev => [...prev, { id: generateId(), text: subtaskInput.trim(), completed: false }]);
    setSubtaskInput('');
  }

  const formattedDate = selectedDate.toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const formattedStartDate = startDate ? startDate.toLocaleDateString(locale, {
    day: 'numeric', month: 'long', year: 'numeric',
  }) : null;

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="none" transparent statusBarTranslucent onRequestClose={animatedClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={animatedClose} />
      <KeyboardAvoidingView style={styles.kavWrapper} behavior="padding" keyboardVerticalOffset={0}>
        <Animated.View style={[styles.sheet, { backgroundColor: colors.surface, transform: [{ translateY }] }]}>
          <View style={styles.handleArea} {...panResponder.panHandlers} hitSlop={{ top: 10, bottom: 10, left: 40, right: 40 }}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('addModal.title')}</Text>
            <TouchableOpacity onPress={animatedClose} style={[styles.closeBtn, { backgroundColor: colors.bg }]} activeOpacity={0.7}>
              <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces={false}>

            {/* Hedef Adı */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('addModal.goalName')} <Text style={{ color: colors.danger }}>*</Text>
              </Text>
              <TextInput
                ref={nameRef}
                style={[styles.input, { borderColor: nameError ? colors.danger : colors.border, color: colors.text, backgroundColor: colors.surface }]}
                placeholder={t('addModal.placeholder.name')}
                placeholderTextColor={colors.textLight}
                value={name}
                onChangeText={txt => { setName(txt); setNameError(false); }}
                maxLength={100}
                returnKeyType="next"
              />
              {nameError && <Text style={[styles.errorText, { color: colors.danger }]}>{t('addModal.error.name')}</Text>}
              <Text style={[styles.charCounter, { color: colors.textLight }]}>{name.length}/100</Text>
            </View>

            {/* Kategori */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.category')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow} keyboardShouldPersistTaps="handled">
                {CATEGORIES.map(cat => {
                  const active = category === cat.key;
                  return (
                    <TouchableOpacity
                      key={cat.key}
                      style={[styles.categoryChip,
                        { backgroundColor: colors.surface2, borderColor: colors.border },
                        active && { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                      ]}
                      onPress={() => setCategory(cat.key)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, { color: colors.textMuted },
                        active && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' }
                      ]}>
                        {cat.icon} {t(`cat.${cat.key}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Hedef Türü: Tek Seferlik / Tekrarlı */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.goalType')}</Text>
              <View style={[styles.toggle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                {['once', 'recurring'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.toggleBtn, goalType === type && [styles.toggleBtnActive, { backgroundColor: colors.surface }]]}
                    onPress={() => { setGoalType(type); setShowDatePicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleBtnText, { color: colors.textMuted },
                      goalType === type && { fontWeight: '700', color: colors.text }
                    ]}>
                      {type === 'once' ? t('addModal.oneTime') : t('addModal.recurringType')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tek Seferlik: Bitiş Tarihi */}
            {goalType === 'once' && (
              <>
                <View style={styles.formGroup}>
                  <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.deadline')}</Text>
                  <View style={[styles.toggle, { backgroundColor: colors.bg, borderColor: colors.border }]}>
                    {['date', 'days'].map(mode => (
                      <TouchableOpacity
                        key={mode}
                        style={[styles.toggleBtn, deadlineMode === mode && [styles.toggleBtnActive, { backgroundColor: colors.surface }]]}
                        onPress={() => { setDeadlineMode(mode); setShowDatePicker(false); }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.toggleBtnText, { color: colors.textMuted },
                          deadlineMode === mode && { fontWeight: '700', color: colors.text }
                        ]}>
                          {mode === 'date' ? t('addModal.pickDate') : t('addModal.countDays')}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {deadlineMode === 'date' && (
                  <View style={styles.formGroup}>
                    <TouchableOpacity
                      style={[styles.dateTrigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
                      onPress={() => setShowDatePicker(v => !v)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.dateTriggerText, { color: colors.text }]}>📅 {formattedDate}</Text>
                      <Text style={[styles.dateTriggerArrow, { color: colors.textMuted }]}>{showDatePicker ? '▴' : '▾'}</Text>
                    </TouchableOpacity>
                    {showDatePicker && (
                      <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'inline' : 'default'}
                        minimumDate={new Date()}
                        onChange={(_, date) => {
                          if (Platform.OS === 'android') setShowDatePicker(false);
                          if (date) setSelectedDate(date);
                        }}
                        style={styles.datePicker}
                      />
                    )}
                  </View>
                )}

                {deadlineMode === 'days' && (
                  <View style={styles.formGroup}>
                    <View style={styles.daysRow}>
                      <TextInput
                        style={[styles.input, styles.daysInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                        placeholder={t('addModal.placeholder.days')}
                        placeholderTextColor={colors.textLight}
                        value={daysInput}
                        onChangeText={setDaysInput}
                        keyboardType="numeric"
                        maxLength={4}
                      />
                      <Text style={[styles.daysUnit, { color: colors.textMuted }]}>{t('addModal.days')}</Text>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Başlangıç Tarihi */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('addModal.startDate')} <Text style={[styles.optional, { color: colors.textLight }]}>{t('addModal.startDateOptional')}</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dateTrigger, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => setShowStartDatePicker(v => !v)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dateTriggerText, { color: formattedStartDate ? colors.text : colors.textLight }]}>
                  🚀 {formattedStartDate || t('addModal.pickDate')}
                </Text>
                <Text style={[styles.dateTriggerArrow, { color: colors.textMuted }]}>{showStartDatePicker ? '▴' : '▾'}</Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  onChange={(_, date) => {
                    if (Platform.OS === 'android') setShowStartDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                  style={styles.datePicker}
                />
              )}
            </View>

            {/* İlerleme */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.progress')}</Text>
              <View style={styles.progressBtns}>
                {PROGRESS_OPTIONS.map(p => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.progressBtn,
                      { borderColor: colors.border, backgroundColor: colors.surface2 },
                      progress === p && { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                    ]}
                    onPress={() => setProgress(p)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.progressBtnText, { color: colors.textMuted },
                      progress === p && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' }
                    ]}>{p}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tekrarlı: Tekrar tipi seçimi */}
            {goalType === 'recurring' && (
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.recurring')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
                  {RECURRING_TYPES.map(type => (
                    <TouchableOpacity
                      key={type}
                      style={[styles.categoryChip,
                        { backgroundColor: colors.surface2, borderColor: colors.border },
                        recurringType === type && { backgroundColor: colors.accentBg, borderColor: colors.accentDark }
                      ]}
                      onPress={() => setRecurringType(type)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, { color: colors.textMuted },
                        recurringType === type && { fontWeight: '700', color: isDark ? colors.accent : '#5A4800' }
                      ]}>
                        {t('addModal.' + type)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {recurringType === 'custom' && (
                  <View style={[styles.daysRow, { marginTop: Spacing.sm }]}>
                    <TextInput
                      style={[styles.input, styles.daysInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                      placeholder="7"
                      placeholderTextColor={colors.textLight}
                      value={recurringInterval}
                      onChangeText={setRecurringInterval}
                      keyboardType="numeric"
                      maxLength={3}
                    />
                    <Text style={[styles.daysUnit, { color: colors.textMuted }]}>{t('addModal.days')}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Alt Görevler */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('addModal.subtasks')}</Text>
              {subtasks.map((s) => (
                <View key={s.id} style={[styles.subtaskRow, { borderColor: colors.border }]}>
                  <Text style={[styles.subtaskText, { color: colors.text }]}>• {s.text}</Text>
                  <TouchableOpacity onPress={() => setSubtasks(prev => prev.filter(item => item.id !== s.id))} activeOpacity={0.7}>
                    <Text style={{ color: colors.danger, fontSize: 14, paddingHorizontal: 4 }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.daysRow}>
                <TextInput
                  style={[styles.input, styles.daysInput, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                  placeholder={t('addModal.subtaskPlaceholder')}
                  placeholderTextColor={colors.textLight}
                  value={subtaskInput}
                  onChangeText={setSubtaskInput}
                  onSubmitEditing={addSubtask}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={[styles.addSubBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                  onPress={addSubtask}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: isDark ? colors.accent : '#5A4800', fontWeight: '700' }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Hatırlatma */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>{t('reminder.label')}</Text>
              <View style={styles.reminderChips}>
                {REMINDER_OPTIONS.map(days => {
                  const active = reminderDays.includes(days);
                  return (
                    <TouchableOpacity
                      key={days}
                      style={[styles.reminderChip,
                        { backgroundColor: active ? colors.accentBg : colors.surface2, borderColor: active ? colors.accentDark : colors.border }
                      ]}
                      onPress={() => setReminderDays(prev =>
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
                {reminderDays.filter(d => !REMINDER_OPTIONS.includes(d)).map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[styles.reminderChip, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                    onPress={() => setReminderDays(prev => prev.filter(d => d !== days))}
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
                  style={[styles.reminderCustomInput, { borderWidth: 1, borderColor: colors.border, color: colors.text, backgroundColor: colors.surface, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.base }]}
                  placeholder={t('reminder.customPlaceholder')}
                  placeholderTextColor={colors.textLight}
                  value={customReminderInput}
                  onChangeText={setCustomReminderInput}
                  keyboardType="numeric"
                  maxLength={3}
                  returnKeyType="done"
                  onSubmitEditing={() => {
                    const n = parseInt(customReminderInput, 10);
                    if (!isNaN(n) && n > 0 && !reminderDays.includes(n)) {
                      setReminderDays(prev => [...prev, n]);
                    }
                    setCustomReminderInput('');
                  }}
                />
                <TouchableOpacity
                  style={[styles.reminderAddBtn, { backgroundColor: colors.accentBg, borderColor: colors.accentDark }]}
                  onPress={() => {
                    const n = parseInt(customReminderInput, 10);
                    if (!isNaN(n) && n > 0 && !reminderDays.includes(n)) {
                      setReminderDays(prev => [...prev, n]);
                    }
                    setCustomReminderInput('');
                  }}
                  activeOpacity={0.75}
                >
                  <Text style={{ color: isDark ? colors.accent : '#5A4800', fontWeight: '700', fontSize: Typography.base }}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notlar */}
            <View style={styles.formGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                {t('addModal.notes')} <Text style={[styles.optional, { color: colors.textLight }]}>{t('addModal.optional')}</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textarea, { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface }]}
                placeholder={t('addModal.placeholder.notes')}
                placeholderTextColor={colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={300}
                textAlignVertical="top"
              />
            </View>

            {/* Butonlar */}
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.border }]}
                onPress={animatedClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>{t('addModal.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} activeOpacity={0.8}>
                <Text style={styles.submitBtnText}>{t('addModal.submit')}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 28 }} />
          </ScrollView>
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
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.92,
    ...Shadows.md,
  },
  handleArea: { alignItems: 'center', paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  handle: { width: 36, height: 4, borderRadius: Radii.full },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: { fontSize: Typography.md, fontWeight: '700', letterSpacing: -0.3 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: Typography.sm, fontWeight: '600' },
  formGroup: { marginBottom: Spacing.lg },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  optional: { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  errorText: { fontSize: Typography.xs, marginTop: 4 },
  charCounter: { position: 'absolute', right: Spacing.sm, bottom: Spacing.xs, fontSize: Typography.xs },
  input: { borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, fontSize: Typography.base },
  categoriesRow: { gap: Spacing.xs, paddingVertical: 2 },
  categoryChip: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2, borderRadius: Radii.full, borderWidth: 1, marginRight: Spacing.xs },
  categoryChipText: { fontSize: Typography.sm, fontWeight: '500' },
  toggle: { flexDirection: 'row', borderWidth: 1, borderRadius: Radii.sm, padding: 4, alignSelf: 'flex-start', gap: 4 },
  toggleBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.sm - 2 },
  toggleBtnActive: { ...Shadows.sm },
  toggleBtnText: { fontSize: Typography.sm, fontWeight: '500' },
  dateTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  dateTriggerText: { fontSize: Typography.base },
  dateTriggerArrow: { fontSize: 12 },
  datePicker: { marginTop: Spacing.xs },
  daysRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  daysInput: { flex: 1 },
  daysUnit: { fontSize: Typography.base, fontWeight: '500' },
  textarea: { minHeight: 80, paddingTop: Spacing.sm },
  formActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cancelBtn: { flex: 1, paddingVertical: Spacing.md - 2, borderRadius: Radii.md, borderWidth: 1, alignItems: 'center' },
  cancelBtnText: { fontSize: Typography.base - 1, fontWeight: '500' },
  submitBtn: {
    flex: 2, paddingVertical: Spacing.md - 2, borderRadius: Radii.md,
    backgroundColor: '#F9E55A', alignItems: 'center',
    shadowColor: '#F9E55A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3,
  },
  submitBtnText: { fontSize: Typography.base - 1, fontWeight: '700', color: '#5A4800' },
  progressBtns: { flexDirection: 'row', gap: Spacing.xs, flexWrap: 'wrap' },
  progressBtn: { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radii.full, borderWidth: 1 },
  progressBtnText: { fontSize: Typography.sm, fontWeight: '500' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  toggleSmall: { borderWidth: 1, borderRadius: Radii.sm, paddingHorizontal: Spacing.sm, paddingVertical: 4 },
  toggleSmallText: { fontSize: Typography.sm, fontWeight: '600' },
  subtaskRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, paddingVertical: Spacing.xs },
  subtaskText: { flex: 1, fontSize: Typography.sm },
  addSubBtn: { borderWidth: 1, borderRadius: Radii.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  reminderChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  reminderChip: { paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2, borderRadius: Radii.full, borderWidth: 1 },
  reminderChipText: { fontSize: Typography.sm, fontWeight: '500' },
  reminderCustomRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  reminderCustomInput: { flex: 1 },
  reminderAddBtn: { borderWidth: 1, borderRadius: Radii.sm, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
