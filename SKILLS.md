# HedefApp — SKILLS.md

Bu dosya, HedefApp projesinde sık yapılan görevler için pratik şablonlar ve kurallar içerir.

---

## 1. Yeni Bileşen Ekleme

```jsx
// src/components/MyComponent.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function MyComponent({ someProp }) {
  const { colors } = useTheme();
  const { t } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.text }}>{t('my.key')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});
```

**Kurallar:**
- Her bileşen `useTheme()` ile renk alır — sabit renk kodu yazılmaz.
- Her kullanıcıya gösterilen metin `t()` ile çevrilir.
- Bileşen dosyası `src/components/` altına eklenir ve `App.js`'te import edilir.

---

## 2. Yeni Çeviri Anahtarı Ekleme

`src/i18n/translations.js` dosyasında **her dil bloğuna** aynı anahtarı ekle:

```js
// translations.js içinde her dil için:
tr: {
  // ...mevcut anahtarlar...
  'my.new.key': 'Yeni metin',
},
en: {
  'my.new.key': 'New text',
},
zh: {
  'my.new.key': '新文本',
},
ja: {
  'my.new.key': '新しいテキスト',
},
ko: {
  'my.new.key': '새 텍스트',
},
```

Kullanım: `t('my.new.key')` veya `t('my.key.with.param', { n: 5 })` → `"{n} gün kaldı"`

---

## 3. Hedef Modelini Genişletme

`useGoals.js` içindeki `normaliseGoal` fonksiyonuna yeni alanın varsayılanını ekle:

```js
function normaliseGoal(g) {
  return {
    updates: [],
    progress: 0,
    subtasks: [],
    recurring: null,
    startDate: null,
    reminderDays: [3, 1],
    folderId: 'default',
    myNewField: 'default_value',  // ← yeni alan buraya
    ...g,
    category: TURKISH_LABEL_TO_KEY[g.category] ?? g.category,
  };
}
```

Ardından `updateGoal` callback'inde bu alanı güncelleme mantığını ekle.

---

## 4. Yeni Kategori Ekleme

`src/constants/categories.js` dosyasını düzenle:

```js
export const CATEGORIES = [
  { key: 'health',   icon: '🏃', labelKey: 'cat.health' },
  { key: 'mycat',    icon: '⭐', labelKey: 'cat.mycat' }, // ← yeni kategori
];

export const TURKISH_LABEL_TO_KEY = {
  'Sağlık': 'health',
  'YeniKategori': 'mycat', // ← eski Türkçe etiket varsa migration için
};
```

`translations.js`'e `'cat.mycat': 'Yeni Kategori'` anahtarını tüm dillere ekle.

---

## 5. Bildirim Zamanlaması

Hedef oluşturma/güncelleme/silmede bu pattern'i takip et:

```js
import {
  scheduleGoalNotifications,
  cancelGoalNotifications,
} from './src/utils/notifications';

// Oluştururken
const newGoal = addGoal(data);
scheduleGoalNotifications(newGoal, t);

// Güncellerken
updateGoal(id, data);
const updated = { ...existingGoal, ...data };
scheduleGoalNotifications(updated, t);

// Silerken veya tamamlarken
cancelGoalNotifications(goalId);
```

---

## 6. Yeni AsyncStorage Anahtarı

Mevcut key'leri **asla değiştirme**. Yeni bir alan için:

```js
const MY_NEW_KEY = 'hedefapp_myfeature_v1';

// Okuma
const raw = await AsyncStorage.getItem(MY_NEW_KEY);
const data = raw ? JSON.parse(raw) : defaultValue;

// Yazma
await AsyncStorage.setItem(MY_NEW_KEY, JSON.stringify(data));
```

---

## 7. Tema Renkleri

`src/constants/theme.js` içinde `LightColors` ve `DarkColors` nesnelerini düzenle. Her iki nesnede de aynı key bulunmalıdır.

```js
// Bileşende kullanım
const { colors, isDark } = useTheme();
// colors.bg, colors.surface, colors.text, colors.primary, colors.border, colors.muted...
```

---

## 8. AdMob – Yeni Reklam Birimi Ekleme

1. `src/config/ads.js`'e yeni ID'yi ekle:
   ```js
   export const MY_INTERSTITIAL_ID = 'ca-app-pub-XXXX/YYYY';
   ```
2. Yeni bir bileşen/hook yaz, `react-native-google-mobile-ads`'ten gerekli API'yi import et.
3. Test sırasında Google'ın resmi test ID'lerini kullan:
   - Banner: `ca-app-pub-3940256099942544/6300978111`
   - Interstitial: `ca-app-pub-3940256099942544/1033173712`

---

## 9. Yedekleme Formatı

`src/utils/backup.js` içindeki `BACKUP_VERSION = 2` sabitini artırarak format değişikliği yapılır.
Geri yükleme sırasında hem yeni hem eski formatı desteklemeye devam et:

```js
const goals = Array.isArray(data) ? data : data?.goals;
const folders = Array.isArray(data?.folders) ? data.folders : [];
```

---

## 10. EAS Build & Yayınlama Akışı

```bash
# 1. Versiyon numarasını güncelle (app.config.js)
#    version: "1.x.x"  ve  versionCode: N+1

# 2. Android APK/AAB build
eas build --platform android --profile production

# 3. Play Store'a yükle
eas submit --platform android --latest

# 4. iOS build
eas build --platform ios --profile production
eas submit --platform ios --latest
```

`eas.json` içindeki `production` profilini değiştirmeden kullan.

---

## 11. Sık Karşılaşılan Sorunlar

| Sorun | Çözüm |
|-------|-------|
| AdMob banner görünmüyor | `src/config/ads.js`'in doğru ID içerdiğini kontrol et; test cihazında test ID kullan |
| Bildirim gelmiyor | `setupNotifications()` izni aldı mı kontrol et; Android kanalı oluşturuldu mu? |
| Eski veri kayboldu | `goaltracker_v1` → `goaltracker_v2` migrasyonu `useGoals.js`'te otomatik yapılır |
| Çeviri çalışmıyor | `translations.js`'te o dil bloğunda anahtar var mı kontrol et |
| Tema uygulanmıyor | Bileşen `useTheme()` kullanıyor mu? `colors.*` sabit renk yerine kullanılıyor mu? |
