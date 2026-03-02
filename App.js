import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StatusBar, FlatList,
  StyleSheet, Platform,
} from 'react-native';

import { useGoals } from './src/hooks/useGoals';
import AppHeader from './src/components/AppHeader';
import ControlsBar from './src/components/ControlsBar';
import FilterTabs from './src/components/FilterTabs';
import GoalCard from './src/components/GoalCard';
import EmptyState from './src/components/EmptyState';
import AddGoalModal from './src/components/AddGoalModal';
import GoalDetailModal from './src/components/GoalDetailModal';
import Toast from './src/components/Toast';
import AdBannerComponent from './src/components/AdBannerComponent';
import { Colors } from './src/constants/theme';

export default function App() {
  const {
    goals,
    rawGoals,
    loaded,
    sortBy, setSortBy,
    filterBy, setFilterBy,
    addGoal,
    updateGoal,
    toggleComplete,
    togglePin,
    deleteGoal,
    addUpdate,
    editUpdate,
    deleteUpdate,
    totalCount,
    dueCount,
  } = useGoals();

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  // goals'a her render'da closure kurmak yerine ref üzerinden oku
  // → handleToggleComplete/handleTogglePin'in goals değiştiğinde yeniden oluşması engellenir
  const rawGoalsRef = useRef(rawGoals);
  useEffect(() => { rawGoalsRef.current = rawGoals; }, [rawGoals]);

  // rawGoals'dan seçili hedefi bul — liste yeniden sıralanınca bile güncel kalır
  const detailGoal = detailGoalId
    ? rawGoals.find(g => g.id === detailGoalId) ?? null
    : null;

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
  }, []);

  const handleAddGoal = useCallback((data) => {
    addGoal(data);
    showToast('✦ Hedef eklendi!');
  }, [addGoal, showToast]);

  const handleToggleComplete = useCallback((id) => {
    const g = rawGoalsRef.current.find(x => x.id === id);
    toggleComplete(id);
    showToast(g?.completed ? '↩️ Geri alındı' : '🎉 Hedef tamamlandı!');
  }, [toggleComplete, showToast]);

  const handleTogglePin = useCallback((id) => {
    const g = rawGoalsRef.current.find(x => x.id === id);
    togglePin(id);
    showToast(g?.pinned ? '☆ Favoriden çıkarıldı' : '⭐ Favoriye alındı');
  }, [togglePin, showToast]);

  const handleDelete = useCallback((id) => {
    deleteGoal(id);
    showToast('🗑 Hedef silindi');
  }, [deleteGoal, showToast]);

  const handleUpdateGoal = useCallback((id, data) => {
    updateGoal(id, data);
    showToast('✓ Hedef güncellendi');
  }, [updateGoal, showToast]);

  const handleAddUpdate = useCallback((goalId, text) => {
    addUpdate(goalId, text);
    showToast('📝 Not eklendi');
  }, [addUpdate, showToast]);

  const handleEditUpdate = useCallback((goalId, updateId, text) => {
    editUpdate(goalId, updateId, text);
    showToast('✓ Not güncellendi');
  }, [editUpdate, showToast]);

  const handleDeleteUpdate = useCallback((goalId, updateId) => {
    deleteUpdate(goalId, updateId);
    showToast('🗑 Not silindi');
  }, [deleteUpdate, showToast]);

  const renderItem = useCallback(({ item }) => (
    <GoalCard
      goal={item}
      onToggleComplete={handleToggleComplete}
      onTogglePin={handleTogglePin}
      onDelete={handleDelete}
      onPress={() => setDetailGoalId(item.id)}
    />
  ), [handleToggleComplete, handleTogglePin, handleDelete]);

  const keyExtractor = useCallback((item) => item.id, []);

  if (!loaded) return null;

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={Colors.surface}
        translucent={false}
      />

      {/* Sabit üst alan — liste uzasa da asla ezilmez */}
      <View style={styles.topFixed}>
        <AppHeader totalCount={totalCount} dueCount={dueCount} />
        <ControlsBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          onAddPress={() => setAddModalVisible(true)}
        />
        <FilterTabs filterBy={filterBy} onFilterChange={setFilterBy} />
      </View>

      {/* Kalan alanı dolduran liste */}
      <View style={styles.listWrapper}>
        <FlatList
          data={goals}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={goals.length === 0 ? styles.emptyContainer : styles.listContent}
          ListEmptyComponent={
            <EmptyState onAddPress={() => setAddModalVisible(true)} />
          }
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* Ad Banner (bottom, always visible) */}
      <AdBannerComponent />

      {/* Yeni Hedef Modal */}
      <AddGoalModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddGoal}
      />

      {/* Hedef Detay + Gelişim Günlüğü Modal */}
      <GoalDetailModal
        goal={detailGoal}
        visible={!!detailGoal}
        onClose={() => setDetailGoalId(null)}
        onUpdateGoal={handleUpdateGoal}
        onAddUpdate={handleAddUpdate}
        onEditUpdate={handleEditUpdate}
        onDeleteUpdate={handleDeleteUpdate}
      />

      {/* Toast */}
      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    // edgeToEdgeEnabled:true ile Android status bar'ının altına çiziliyor.
    // SafeAreaView bu durumda yeterli olmuyor; StatusBar.currentHeight
    // tam olarak gereken boşluğu verir, fazlasını değil.
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 44,
  },
  // Üst kontroller — liste uzasa da boyutu değişmez
  topFixed: {
    flexShrink: 0,
  },
  // FlatList kapsayıcı — kalan tüm boşluğu alır
  listWrapper: {
    flex: 1,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  emptyContainer: {
    flexGrow: 1,
  },
});
