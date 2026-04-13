# HedefApp — CLAUDE.md

> **Proje:** HedefApp — Minimalist Hedef Takip Uygulaması  
> **Platform:** React Native + Expo (iOS & Android)  
> **Versiyon:** 1.2.1 (versionCode: 4)  
> **Bundle ID:** `com.r1cha.hedefApp`

---

## Proje Özeti

HedefApp, kullanıcıların hedeflerini oluşturup takip edebildiği minimalist bir mobil uygulamadır. React Native / Expo ile yazılmış olup Google AdMob ile monetize edilmektedir. Veri AsyncStorage'da yerel olarak saklanır — backend veya bulut senkronizasyonu **yoktur**.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native 0.81.5 + Expo ~54 |
| State | React `useState` / `useReducer` (hook tabanlı) |
| Depolama | `@react-native-async-storage/async-storage` |
| Bildirimler | `expo-notifications` |
| Takvim | `expo-calendar`, `react-native-calendars` |
| Yedekleme | `expo-file-system` + `expo-sharing` + `expo-document-picker` |
| Reklamlar | `react-native-google-mobile-ads` (AdMob Banner) |
| i18n | Özel context + `src/i18n/translations.js` |
| Derleme | EAS Build (eas.json) |

---

## Klasör Yapısı

```
hedefapp/
├── App.js                  # Uygulama giriş noktası; tüm provider'ları ve modal'ları barındırır
├── app.config.js           # Dinamik Expo konfigürasyonu (AdMob ID'leri buraya eklenir)
├── index.js                # Expo entry point
├── eas.json                # EAS Build profilleri
├── src/
│   ├── components/         # UI bileşenleri (15 adet)
│   ├── hooks/              # useGoals, useFolders, useCounterRecords
│   ├── contexts/           # ThemeContext
│   ├── i18n/               # LanguageContext + translations.js
│   ├── utils/              # notifications, backup, dateUtils, calendar
│   └── constants/          # categories, theme renk paletleri
├── assets/                 # icon, splash, adaptive-icon, favicon
└── src/config/ads.js       # GİTİGNORE — gerçek AdMob ID'leri burada tutulur
```

---

## Temel Mimari

### Veri Akışı

```
AsyncStorage (goaltracker_v2) → useGoals → AppContent → GoalCard / GoalDetailModal
AsyncStorage (goaltracker_folders_v1) → useFolders → SideDrawer / FolderPickerModal
```

- **`useGoals(activeFolderId)`** — merkezi hedef yönetimi: CRUD, sıralama, filtreleme, arama, alt görevler, notlar
- **`useFolders()`** — klasör yönetimi (add, rename, delete)
- **`useCounterRecords()`** — sayaç kaydı yönetimi (CounterModal için)
- **`ThemeContext`** — `light | dark | system` tema modu, AsyncStorage'da persist edilir
- **`LanguageContext`** — `tr | en | zh | ja | ko`, `t(key, params)` fonksiyonu ile çeviri

### Hedef Veri Modeli

```js
{
  id: string,           // UUID benzeri timestamp tabanlı ID
  name: string,
  category: string,     // constants/categories.js'teki anahtarlar
  deadline: string,     // "YYYY-MM-DD"
  startDate: string | null,
  description: string,
  completed: boolean,
  pinned: boolean,
  createdAt: string,    // ISO 8601
  progress: number,     // 0-100 (alt görevlerden otomatik hesaplanır)
  recurring: { type: 'daily'|'weekly'|'monthly', interval?: number } | null,
  subtasks: Array<{ id, text, completed }>,
  updates: Array<{ id, text, date }>,
  reminderDays: number[], // [3, 1] = 3 gün ve 1 gün önce bildirim
  folderId: string,     // varsayılan: 'default'
}
```

### Depolama Anahtarları

| Anahtar | İçerik |
|---------|--------|
| `goaltracker_v1` | Eski format (migrasyon için okunur) |
| `goaltracker_v2` | Mevcut format (hedefler) |
| `goaltracker_folders_v1` | Klasörler |
| `goaltracker_counters_v1` | Sayaç kayıtları |
| `app_theme` | `'light' \| 'dark' \| 'system'` |
| `app_language` | `'tr' \| 'en' \| 'zh' \| 'ja' \| 'ko'` |

---

## Bileşenler (src/components/)

| Bileşen | Açıklama |
|---------|----------|
| `AppHeader` | Başlık, hedef sayısı, menü butonu |
| `ControlsBar` | Sıralama seçici + "Hedef Ekle" butonu |
| `FilterTabs` | active / completed / pinned / all filtreleri |
| `SearchBar` | İsim & açıklama arama |
| `GoalCard` | Hedef listesi satırı (tamamla, pinle, sil) |
| `EmptyState` | Hedef yokken gösterilen ekran |
| `AddGoalModal` | Yeni hedef ekleme formu |
| `GoalDetailModal` | Hedef detay, düzenleme, alt görev, not ekleme |
| `StatsModal` | İstatistikler (kategori dağılımı vb.) |
| `CalendarModal` | Takvim görünümü |
| `SideDrawer` | Yan menü: stats, takvim, sayaç, yedekleme, ayarlar |
| `FolderPickerModal` | Klasör seçici ve yöneticisi |
| `CounterModal` | Sayaç kayıt takibi |
| `Toast` | Geçici bildirim mesajı |
| `AdBannerComponent` | AdMob banner reklamı |

---

## AdMob Yapılandırması

- **Gerçek ID'ler:** `src/config/ads.js` içinde tutulur (`.gitignore`'da)
- **Fallback (test):** `app.config.js`'te sabit test ID'leri
- Banner `AdBannerComponent.js` içinde, `src/config/ads.js`'ten bağımsız çalışır
- Yeni banner/interstitial ID eklemek için `src/config/ads.js` düzenle

---

## Bildirimler

- `expo-notifications` üzerinden çalışır
- Her hedef için `reminderDays` (varsayılan `[3, 1]`) kadar önceden zamanlanmış bildirim oluşturulur
- Android'de `goal-reminders` kanalı kullanılır (HIGH importance)
- `CALENDAR` trigger tipi tercih edilir (en güvenilir Android desteği)

---

## Yedekleme & Geri Yükleme

- `exportBackup()` → JSON dosyası oluşturur, `expo-sharing` ile paylaşır
- `importBackup()` → `expo-document-picker` ile JSON seçilir, AsyncStorage'a yazılır
- Hem yeni (`{ version, goals, folders }`) hem eski (düz array) format desteklenir

---

## Çeviri (i18n)

- `src/i18n/translations.js` içinde tüm dillerin düz anahtar-değer sözlüğü bulunur
- `t('key', { param: value })` ile kullanılır — parametreler `{param}` placeholder'ı ile yerleştirilir
- Yeni dil eklemek için `translations.js`'e yeni blok ve `LanguageContext.js`'e yeni entry ekle

---

## Geliştirme Komutları

```bash
# Geliştirme sunucusu
npx expo start

# Android emülatör
npx expo start --android

# iOS simülatör
npx expo start --ios

# Üretim build (EAS)
eas build --platform android --profile production
eas build --platform ios --profile production

# Play Store gönderimi
eas submit --platform android
```

---

## Önemli Kurallar

1. **`src/config/ads.js` asla commit edilmez** — `.gitignore`'a eklidir; CI/CD test ID'leriyle çalışır.
2. **AsyncStorage key'leri değiştirilmez** — veri kayıplarına yol açar; migrasyon gerekiyorsa yeni key kullan ve eski key'i oku.
3. **`t()` fonksiyonu kullan** — bileşenlere hiçbir zaman sabit Türkçe/İngilizce string yazılmaz.
4. **`useCallback` ve `useRef`** — `App.js` ve büyük hook'larda performans için bunları kullan.
5. **Yinelenen hedefler** — tamamlanınca `createNextInstance` ile bir sonraki örnekleri otomatik oluşturulur.
6. **Bildirimler** — hedef oluşturma/güncelleme/silme işlemlerinde `scheduleGoalNotifications` / `cancelGoalNotifications` çağrılır.
