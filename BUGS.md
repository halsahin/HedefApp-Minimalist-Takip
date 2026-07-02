# HedefApp — BUGS.md

| ID | Dosya | Hata Açıklaması |
|----|-------|-----------------|

---

## ✅ Düzeltilen Hatalar

| ID | Dosya | Yapılan Değişiklik |
|----|-------|-------------------|
| BUG-01 | `useCounterRecords.js` | `persist()` fonksiyonuna `.catch` eklendi — hata sessizce yutulmaktan kurtarıldı |
| BUG-02 | `useFolders.js`, `translations.js`, `App.js` | Varsayılan klasör adı `'folder.default'` i18n anahtarına taşındı; tüm 5 dile çeviri eklendi; `getLocalizedFolders(t)` helper ile çözümleniyor |
| BUG-03 | `GoalDetailModal.js` | Kaydedilmemiş değişiklikler varsa `Alert.alert` ile kullanıcıyı uyaran `cancelGoalEdit()` eklendi |
| BUG-04 | `dateUtils.js` | `generateId()`'de suffix `slice(2,7)`'den `slice(2)` (tam string) olarak güncellendi — entropi artırıldı |
| BUG-05 | `AddGoalModal.js` | `const SCREEN_HEIGHT` sabit kaldırıldı; `useWindowDimensions()` hook'u ile dinamik `screenHeight` kullanıldı |
| BUG-06 | `SideDrawer.js` | Animasyon ref'e (`animRef`) atanıyor; her yeni `visible` değişiminde `.stop()` çağrılarak race condition engellendi |
| BUG-07 | `GoalDetailModal.js` | `KeyboardAvoidingView` için `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` düzeltildi |
| BUG-08 | `App.js` | `toggleComplete(id)` dönüş değeri `newGoal` olarak yakalanıyor; yinelenen hedefin yeni örneği için `scheduleGoalNotifications(newGoal, t)` çağrıldı |
| BUG-09 | `GoalDetailModal.js` | `editRecurring` state eklendi; `save()` içinde `recurring: editRecurring` alanı iletiliyor |
| BUG-10 | `calendar.js` | İzin reddedildiğinde `Linking.openSettings()` ile sistem ayarları otomatik açılıyor |
| BUG-11 | `AddGoalModal.js` | Alt görev silme `prev.filter((_, idx) => idx !== i)` → `prev.filter(item => item.id !== s.id)` olarak düzeltildi |
| BUG-12 | `GoalCard.js` | `translateX.setValue(0)` çağrısı `Alert` callback'lerine taşındı; kullanıcı onaylamadan kart sıfırlanmıyor |
| BUG-13 | `notifications.js` | Yalnızca geliştirme ortamını etkileyen singleton cache sorunu; `_N` pattern korundu, production'da değişklik gerekmez (kabul edildi) |
| BUG-14 | `useGoals.js`, `useFolders.js`, `App.js` | `moveGoalsToDefaultFolder(folderId)` fonksiyonu eklendi; `handleDeleteFolder` wrapper'ı ile klasör silinmeden önce içindeki hedefler `'default'`'a taşınıyor |
| BUG-15 | `GoalDetailModal.js` | `hasTimeline` zaten `!goal.completed` kontrolü yapıyordu; `!!` ile tip güvenliği sağlandı |
| BUG-16 | `StatsModal.js`, `CalendarModal.js`, `CounterModal.js` | Header stillerine `paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + Spacing.md : 44 + Spacing.md` eklendi; status bar overlap düzeltildi |
| BUG-17 | `CalendarModal.js` | Kullanılmayan `today` değişkeni kaldırıldı. |
| BUG-18 | `useGoals.js` | `createNextInstance` fonksiyonunda yeni tarih (`newDeadline`) atanırken, `toISOString()` yerine yerel zamanı baz alan format (örn. `getFullYear`, `getMonth`, `getDate`) kullanıldı. |
| BUG-19 | `EmptyState.js` | Ekleme (CTA) butonundaki hardcode renkler kaldırılarak temanın dinamik `colors.accent` ve `colors.accentDark` renkleri kullanıldı. |
| BUG-20 | `CounterModal.js` | Sayaçlarda (Pomodoro, Kronometre, Zamanlayıcı) `time-diffing` (zaman farkı) yöntemine geçildi ve modal kapandığında çalışan otomatik sıfırlama (`fullReset()`) kaldırıldı. Böylece uygulama arka plandayken veya modal kapalıyken bile sayaçların çalışmaya devam etmesi sağlandı. |
| BUG-21 | `app.config.js`, `package.json` | EAS Build `.gitignore` içindeki `android/` dizinini yoksaydığı için Proguard kuralları bulut derlemesine (production) geçmiyordu ve `NoSuchMethodError` (ReturnTypeKt vb.) kaynaklı çökmeler devam ediyordu. `expo-build-properties` paketi kurularak `extraProguardRules` ile eksik kurallar doğrudan `app.config.js` içine eklendi. |
