# HedefApp - Proje Hafızası (Project Memory)

Bu dosya, Antigravity CLI tarafından projenin gelişim sürecini, yapılan değişiklikleri ve teknik mimarisini hatırlamak amacıyla oluşturulmuştur. Sonraki oturumlarda projeye hızlıca adapte olabilmek için bir "beyin" görevi görür.

## 🛠️ Teknik Altyapı ve Mimari
- **Framework:** React Native (Expo)
- **State Management:** React Context API (`ThemeContext`, `LanguageContext`), Custom Hooks (`useGoals`, `useFolders`)
- **Depolama (Storage):** AsyncStorage (`goaltracker_v2` hedefler için, `goaltracker_folders_v1` klasörler için, `drive_autosync` otomatik senkronizasyon vb.)
- **Bulut Yedekleme:** Google Drive API (`@react-native-google-signin/google-signin` kullanılarak)
- **Bildirimler:** `expo-notifications` (Android uyumluluğu için iOS tabanlı `calendar` yerine `date` trigger'ı kullanılıyor)
- **Çoklu Dil:** `LanguageContext` ile yönetiliyor (Şu an TR, EN, ZH, JA, KO destekleniyor)

## 🎨 Tasarım ve UI/UX Prensipleri
- **Vektörel İkonlar:** Uygulamanın hiçbir yerinde emoji kullanılmıyor (sadece dil bayrakları hariç). Tüm ikonlar `@expo/vector-icons/Feather` kütüphanesinden standartlaştırıldı.
- **Renk Teması:** Açık/Koyu mod ve sistem teması destekleniyor. Kullanıcının istediği Accent (Vurgu) rengini seçebilmesi için "Özel Temalar" (Custom Themes) altyapısı bulunuyor.
- **Glassmorphism & Animasyonlar:** Side Drawer, Modallar ve Empty State ekranlarında yumuşak spring animasyonları ve şık blur/glass efekti hissi veren tasarımlar kullanıldı.

## ✅ Son Oturumda Çözülen Önemli Hatalar (Bugs Fixed)
1. **Google Drive Senkronizasyon (Multipart Upload) Sorunu:** 
   - *Sorun:* Türkçe/UTF-8 karakter içeren hedefler eklendiğinde byte-length mismatch yüzünden Drive yedeklemesi sessizce hata verip eski haline dönüyordu.
   - *Çözüm:* Google API multipart request üzerinden `Content-Length` header'ı kaldırılarak fetch() api'sinin byte boyutunu otomatik hesaplaması sağlandı. Ayrıca `existingFileId` ile PATCH isteği atılırken `parents` parametresi kaldırılarak 400 Bad Request hatası engellendi.
2. **Drive Cache (Önbellek) Sorunu:**
   - *Sorun:* Dosya inerken eski verinin inmesi.
   - *Çözüm:* `downloadFromDrive` fonksiyonunda `alt=media` url'sine `_t=${Date.now()}` timestamp'i eklenerek önbellek bypass edildi.
3. **Drive Storage Key Sorunu:**
   - *Sorun:* İndirilen verilerin yanlış bir anahtara (`goals_v2`) kaydedilip ana veritabanı okuyucusunun (`goaltracker_v2`) bunu görememesi.
   - *Çözüm:* İçe aktarma (import) işlemi doğru anahtar ile düzeltildi.
4. **Klasör Senkronizasyonu:**
   - *Sorun:* Yalnızca hedef eklendiğinde yedekleme yapılıyordu, yeni klasör oluşturulduğunda yedekleme tetiklenmiyordu.
   - *Çözüm:* `useFolders.js` içine `syncToDrive` entegre edildi.
5. **UI/UX Düzeltmeleri:**
   - Android cihazlarda takvim bildirimleri çökmesi düzeltildi. (Date type'a geçirildi)
   - Uygulama içindeki başlıklar `toLocaleUpperCase(language === 'tr' ? 'tr-TR' : 'en-US')` ile Türkçe "i" uyumlu olarak büyütüldü.
   - Drive menüsüne, giriş yapılı kullanıcının mail adresini görme ve hesabı değiştirme butonu eklendi. Çıkış yapıldığında promise lock konularak çakışma (crash) önlendi.
   - CustomThemes'te renk paletine tıklandığında seçili olan rengin üzerine konan tik işaretinin "c.text" okuyamaması (ReferenceError) düzeltilip, dinamik siyah/beyaz zıtlığı eklendi.
6. **Play Store (Production) Çökme ve Reklam Sorunu:**
   - *Sorun:* Play Store için App Bundle derlendiğinde uygulamanın açılır açılmaz çökmesi (NoSuchMethodError - ReturnTypeKt) ve .gitignore sebebiyle reklam ID'lerinin bulut derlemesine gitmemesi. Ayrıca `.gitignore` dosyasında `android/` klasörü ignore edildiği için yerel proguard ayarları EAS tarafından yoksayılıyordu.
   - *Çözüm:* `app.config.js` dosyasına `expo-build-properties` eklendi ve `extraProguardRules` içerisine hem Expo Kotlin modüllerini (expo.modules.**, kotlin.**) hem de Google Mobile Ads (com.google.**) sınıflarını koruyan proguard kuralları inject edildi. Ayrıca `app.config.js` ortam değişkenlerini (EAS Secrets) okuyacak şekilde güncellendi ve App.js içerisine eksik olan `mobileAds().initialize()` eklendi.

## 🚀 Play Store Süreci
- Versiyon (Version): `1.3.0`
- Versiyon Kodu (VersionCode): `6` (Derleme hatası sebebiyle 5 iptal edilip 6'ya geçildi)
- Derleme Komutu: `eas build -p android --profile production`

## 📝 Sonraki Oturum İçin Notlar (Future Roadmap)
- Uygulama şu anda tamamen stabil çalışıyor. Herhangi bir yeni özellik eklendiğinde veya UI değiştirildiğinde **mutlaka Feather icons kullanılmasına** ve **AsyncStorage key'lerinin (goaltracker_v2 vs) doğru girilmesine** dikkat edilmeli.
- Klasör silme işleminde içinde hedef bulunan klasörler silinirse, içindeki hedeflerin "Varsayılan" klasöre taşınması veya silinmesi özelliği opsiyonel olarak ileride düşünülebilir. (Şu anda useFolders üzerinden yönetiliyor)
