import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radii, Shadows } from '../constants/theme';
import { CATEGORIES } from '../constants/categories';
import { defaultDeadline, deadlineFromDays } from '../utils/dateUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height;
// Üstten bu kadar px aşağı sürüklenirse veya bu hız aşılırsa kapanır
const SWIPE_CLOSE_THRESHOLD = 80;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

/**
 * AddGoalModal — Bottom-sheet modal with:
 *   ✓ KeyboardAvoidingView: klavye açılınca içerik yukarı kayar
 *   ✓ Swipe-to-dismiss: handle'dan aşağı kaydırınca modal kapanır
 *   ✓ Pastel sarı/gri tasarım korunmuştur
 */
export default function AddGoalModal({ visible, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].label);
  const [deadlineMode, setDeadlineMode] = useState('date');
  const [selectedDate, setSelectedDate] = useState(new Date(defaultDeadline() + 'T12:00:00'));
  const [daysInput, setDaysInput] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const nameRef = useRef(null);
  // Swipe animasyon değeri (0 = kapalı pozisyon, SCREEN_HEIGHT = görünür konum)
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // ── Modal açılış / kapanış animasyonu ────────────────────
  useEffect(() => {
    if (visible) {
      // Formu sıfırla
      setName('');
      setCategory(CATEGORIES[0].label);
      setDeadlineMode('date');
      setSelectedDate(new Date(defaultDeadline() + 'T12:00:00'));
      setDaysInput('');
      setDescription('');
      setNameError(false);
      setShowDatePicker(false);
      translateY.setValue(SCREEN_HEIGHT); // başlangıç: ekranın altında

      // Sheet'i yukarı çek (native Modal'ın animationType="slide"'ı ile benzer)
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 4,
      }).start(() => {
        setTimeout(() => nameRef.current?.focus(), 200);
      });
    }
  }, [visible]);

  // ── Kapatma animasyonu ────────────────────────────────────
  function animatedClose() {
    Keyboard.dismiss();
    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  // ── PanResponder — swipe-to-dismiss ──────────────────────
  const panResponder = useRef(
    PanResponder.create({
      // Yalnızca dikey aşağı hareketi yakala
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onMoveShouldSetPanResponderCapture: (_, g) =>
        g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),

      onPanResponderMove: (_, g) => {
        // Yalnızca aşağı hareket izin ver (negatif dy = yukarı = engelle)
        if (g.dy > 0) translateY.setValue(g.dy);
      },

      onPanResponderRelease: (_, g) => {
        if (
          g.dy > SWIPE_CLOSE_THRESHOLD ||
          g.vy > SWIPE_VELOCITY_THRESHOLD
        ) {
          // Eşik aşıldı → kapat
          animatedClose();
        } else {
          // Eşik aşılmadı → geri yerine getir
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 6,
          }).start();
        }
      },
    })
  ).current;

  // ── Form submit ────────────────────────────────────────────
  function handleSubmit() {
    if (!name.trim()) {
      setNameError(true);
      nameRef.current?.focus();
      return;
    }

    let deadline;
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

    onSubmit({ name, category, deadline, description });
    animatedClose();
  }

  const formattedDate = selectedDate.toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  // Modal görünür değilse render etme (performans)
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"   // kendi Animated.spring animasyonumuzu kullanıyoruz
      transparent
      statusBarTranslucent   // Android'de overlay tam ekran kaplasın
      onRequestClose={animatedClose}
    >
      {/* ── Karartma overlay ── */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={animatedClose}
      />

      {/* ── Klavye + Sheet sarmalayıcı ──
           KAV tam ekranı kaplar, sheet alta hizalanır.
           behavior='padding' her iki platformda da çalışır;
           klavye açılınca KAV yukarıdan sıkışır → sheet otomatik kayar. */}
      <KeyboardAvoidingView
        style={styles.kavWrapper}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY }] }]}
        >
          {/* ── Drag handle (swipe-to-dismiss tetikleyicisi) ── */}
          <View
            style={styles.handleArea}
            {...panResponder.panHandlers}
            hitSlop={{ top: 10, bottom: 10, left: 40, right: 40 }}
          >
            <View style={styles.handle} />
          </View>

          {/* ── Başlık ── */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Yeni Hedef Ekle</Text>
            <TouchableOpacity
              onPress={animatedClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* ── Form içeriği (kaydırılabilir) ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Hedef Adı */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Hedef Adı <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                ref={nameRef}
                style={[styles.input, nameError && styles.inputError]}
                placeholder="örn. IELTS sınavına hazırlan"
                placeholderTextColor={Colors.textLight}
                value={name}
                onChangeText={t => { setName(t); setNameError(false); }}
                maxLength={100}
                returnKeyType="next"
              />
              {nameError && (
                <Text style={styles.errorText}>Hedef adı boş bırakılamaz</Text>
              )}
              <Text style={styles.charCounter}>{name.length}/100</Text>
            </View>

            {/* Kategori */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Kategori</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}
                keyboardShouldPersistTaps="handled"
              >
                {CATEGORIES.map(cat => {
                  const active = category === cat.label;
                  return (
                    <TouchableOpacity
                      key={cat.label}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                      onPress={() => setCategory(cat.label)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                        {cat.icon} {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Bitiş Tarihi Toggle */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bitiş Tarihi</Text>
              <View style={styles.toggle}>
                {['date', 'days'].map(mode => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.toggleBtn, deadlineMode === mode && styles.toggleBtnActive]}
                    onPress={() => { setDeadlineMode(mode); setShowDatePicker(false); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.toggleBtnText, deadlineMode === mode && styles.toggleBtnTextActive]}>
                      {mode === 'date' ? 'Tarih Seç' : 'Gün Say'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Tarih seçici */}
            {deadlineMode === 'date' && (
              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.dateTrigger}
                  onPress={() => setShowDatePicker(v => !v)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.dateTriggerText}>📅 {formattedDate}</Text>
                  <Text style={styles.dateTriggerArrow}>{showDatePicker ? '▴' : '▾'}</Text>
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

            {/* Gün sayısı girişi */}
            {deadlineMode === 'days' && (
              <View style={styles.formGroup}>
                <View style={styles.daysRow}>
                  <TextInput
                    style={[styles.input, styles.daysInput]}
                    placeholder="örn. 30"
                    placeholderTextColor={Colors.textLight}
                    value={daysInput}
                    onChangeText={setDaysInput}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <Text style={styles.daysUnit}>gün</Text>
                </View>
              </View>
            )}

            {/* Notlar */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Notlar <Text style={styles.optional}>(isteğe bağlı)</Text>
              </Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="Hedefiniz hakkında kısa bir not..."
                placeholderTextColor={Colors.textLight}
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
                style={styles.cancelBtn}
                onPress={animatedClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>✦ Hedef Ekle</Text>
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
  // KAV tam ekrana yayılır; sheet alta hizalanır (justifyContent: flex-end).
  // Klavye açılınca KAV üsten sıkışır ve sheet otomatik yukarı kayar.
  kavWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    maxHeight: SCREEN_HEIGHT * 0.92,
    ...Shadows.lg,
  },
  // Handle alanı — PanResponder buraya bağlı, dokunma hitbox'ı geniş
  handleArea: {
    alignItems: 'center',
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radii.full,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.text,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: Typography.sm,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  required: { color: Colors.danger },
  optional: {
    fontWeight: '400',
    color: Colors.textLight,
    textTransform: 'none',
    letterSpacing: 0,
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
  inputError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: Typography.xs,
    color: Colors.danger,
    marginTop: 4,
  },
  charCounter: {
    position: 'absolute',
    right: Spacing.sm,
    bottom: Spacing.xs,
    fontSize: Typography.xs,
    color: Colors.textLight,
  },
  categoriesRow: {
    gap: Spacing.xs,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radii.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.xs,
  },
  categoryChipActive: {
    backgroundColor: Colors.accentBg,
    borderColor: Colors.accentDark,
  },
  categoryChipText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  categoryChipTextActive: {
    fontWeight: '700',
    color: '#5A4800',
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.sm,
    padding: 4,
    alignSelf: 'flex-start',
    gap: 4,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.sm - 2,
  },
  toggleBtnActive: {
    backgroundColor: Colors.surface,
    ...Shadows.sm,
  },
  toggleBtnText: {
    fontSize: Typography.sm,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  toggleBtnTextActive: {
    fontWeight: '700',
    color: Colors.text,
  },
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
  },
  dateTriggerText: {
    fontSize: Typography.base,
    color: Colors.text,
  },
  dateTriggerArrow: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  datePicker: {
    marginTop: Spacing.xs,
  },
  daysRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  daysInput: {
    flex: 1,
  },
  daysUnit: {
    fontSize: Typography.base,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  textarea: {
    minHeight: 80,
    paddingTop: Spacing.sm,
  },
  formActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: Typography.base - 1,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  submitBtn: {
    flex: 2,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radii.md,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    fontSize: Typography.base - 1,
    fontWeight: '700',
    color: '#5A4800',
  },
});
