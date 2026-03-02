# Hedef Takip Uygulaması

Kişisel hedeflerini takip etmek için geliştirilmiş minimalist bir React Native uygulaması. Günlük hayatta belirlediğin hedefleri kaydet, kategorilere ayır, son tarihleri takip et ve ilerleme notları ekle.

---

## Özellikler

- **Hedef Ekleme** — İsim, kategori, bitiş tarihi ve açıklama ile hedef oluştur
- **Tarih Modu** — Takvimden tarih seç veya "kaç gün sonra" gir
- **Kategoriler** — Kişisel, Kariyer, Sağlık, Eğitim, Finans, İlişkiler, Hobi
- **Gelişim Günlüğü** — Her hedef için ilerleme notları tut
- **Sıralama & Filtreleme** — Kalan güne, tarihe, kategoriye veya isme göre sırala
- **Sabitleme** — Önemli hedefleri favori olarak üste sabitle
- **Tamamlama** — Hedefleri tamamlandı olarak işaretle
- **Kalıcı Depolama** — AsyncStorage ile veriler uygulama kapansa da korunur
- **Google Ads** — Banner reklam desteği

---

## Ekran Görüntüleri

> *(yakında)*

---

## Teknolojiler

| Paket | Versiyon |
|-------|----------|
| React Native | 0.81.5 |
| Expo | ~54.0.33 |
| React | 19.1.0 |
| AsyncStorage | ^2.2.0 |
| DateTimePicker | ^8.6.0 |
| Google Mobile Ads | ^16.0.3 |

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Expo ile başlat
npx expo start

# Android için
npx expo start --android
```

> Android cihaz veya emülatör gerektirir.

---

## Proje Yapısı

```
hedefapp/
├── App.js                          # Ana uygulama, state yönetimi
├── src/
│   ├── components/
│   │   ├── AddGoalModal.js         # Hedef ekleme bottom-sheet modal
│   │   ├── GoalDetailModal.js      # Hedef detay & gelişim günlüğü
│   │   ├── GoalCard.js             # Liste kartı bileşeni
│   │   ├── AppHeader.js            # Üst başlık
│   │   ├── ControlsBar.js          # Sıralama & ekleme kontrolleri
│   │   ├── FilterTabs.js           # Filtre sekmeleri
│   │   ├── EmptyState.js           # Boş liste ekranı
│   │   ├── Toast.js                # Bildirim bileşeni
│   │   └── AdBannerComponent.js    # Google Ads banner
│   ├── hooks/
│   │   └── useGoals.js             # Tüm hedef state'i & AsyncStorage
│   ├── utils/
│   │   └── dateUtils.js            # Tarih hesaplama yardımcıları
│   └── constants/
│       ├── categories.js           # Kategori listesi
│       └── theme.js                # Renk & tipografi sabitleri
└── assets/                         # İkonlar & görseller
```

---

## Yapay Zeka Desteği

Bu uygulama **Claude Sonnet 4.6** (Anthropic) ile geliştirilmiştir.

---

## Lisans

MIT
