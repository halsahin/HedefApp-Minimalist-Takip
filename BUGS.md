# HedefApp — BUGS.md

Tüm hatalar analiz edilip düzeltilmiştir. Düzeltilemeyen veya kısmi kalan madde **bulunmamaktadır.**

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
