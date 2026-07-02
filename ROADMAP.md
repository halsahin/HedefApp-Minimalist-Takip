# HedefApp — ROADMAP

Bu dosya, HedefApp için planlanan gelecekteki özellikleri, mimari güncellemeleri ve iyileştirmeleri içerir.

## 1. Google Drive Auto-Sync (Bulut Yedekleme)
- **Açıklama:** Kullanıcıların JSON yedeğini manuel olarak dışa aktarması (share) yerine, doğrudan Google hesabına bağlanarak sessizce arka planda yedekleme yapması.
- **Detaylar:**
  - `expo-auth-session` veya `@react-native-google-signin/google-signin` ile OAuth2 kimlik doğrulaması.
  - `drive.appdata` (Gizli Uygulama Verisi) scope'u kullanılarak yedeğin kullanıcının Drive'ında görünmez ama senkronize bir alanda tutulması.
  - Uygulama arka plana atıldığında veya her yeni bir aksiyonda (optimizasyon ile) senkronizasyon yapılması.
  - Yeni cihazda kurulum yapıldığında "Mevcut yedeğiniz bulundu, geri yüklensin mi?" uyarısı verilmesi.

## 2. Mimari ve Performans (Veritabanı Geçişi)
- **Açıklama:** Veri boyutu büyüdükçe (binlerce hedef, not, alt görev) yaşanabilecek RAM ve render sorunlarının önüne geçmek.
- **Detaylar:**
  - `AsyncStorage` yerine **WatermelonDB** veya **Expo SQLite** kullanılarak ilişkisel (relational) veritabanı yapısına geçiş.
  - Hedeflerin sadece görünür olanlarının veya sayfalanmış (paginated) halinin belleğe yüklenmesi.

## 3. Oyunlaştırma (Gamification) ve Motivasyon
- **Açıklama:** Kullanıcının uygulamada daha fazla vakit geçirmesini ve hedeflerine sadık kalmasını sağlayacak psikolojik tetikleyiciler eklemek.
- **Detaylar:**
  - **Streak (Seri) Sistemi:** Tekrarlayan görevleri art arda yaptıkça alev (🔥) serisi oluşturma.
  - **Rozet ve Seviyeler:** Tamamlanan hedef sayısına göre "Disiplinli", "Üretken" gibi rozetler kazanılması ve ufak animasyonlarla kutlanması.

## 4. İleri Seviye UI/UX ve Animasyonlar
- **Açıklama:** Uygulamanın görsel kalitesini ve premium hissiyatını artırmak.
- **Detaylar:**
  - Hedef tamamlandığında ekranda patlayan **Konfeti Animasyonu** (Lottie veya `react-native-confetti-cannon`).
  - Sayfa geçişleri, kaydırma ve modal etkileşimlerini daha akıcı hale getirmek için **React Native Reanimated** entegrasyonu.
  - Klasörler için varsayılan emojiler yerine **Özel Renk Seçici (Color Picker)** ve ikon paleti desteği.

## 5. Widget ve İşletim Sistemi Entegrasyonları
- **Açıklama:** İşletim sisteminin yerel özellikleriyle daha derin bir entegrasyon.
- **Detaylar:**
  - **Home Screen Widget:** iOS ve Android ana ekranı için günün görevlerini (Due Today) gösteren interaktif veya salt okunur widget'lar.
  - **HealthKit / Google Fit:** Sağlık kategorisindeki hedefler (Örn: Adım atma, su içme) için verilerin otomatik çekilmesi.

## 6. Gelişmiş İstatistikler ve Medya Desteği
- **Açıklama:** İlerlemenin daha görsel ve zengin analiz edilebilmesi.
- **Detaylar:**
  - **Grafikler:** `react-native-chart-kit` kullanılarak aylık/haftalık başarı oranlarının pasta veya çizgi grafiklerle gösterimi.
  - **Aktivite Haritası (Heatmap):** Yıl içindeki yoğun günleri gösteren GitHub tarzı katkı haritası.
  - **Zengin Günlük (Rich Journal):** İlerleme notlarına (Updates) sadece metin değil, öncesi/sonrası fotoğrafları veya ses kaydı eklenebilmesi.
