import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, StatusBar as RNStatusBar, FlatList,
  StyleSheet, Platform,
} from 'react-native';
import Constants from 'expo-constants';

import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { LanguageProvider, useLanguage } from './src/i18n/LanguageContext';
import { useGoals } from './src/hooks/useGoals';
import AppHeader from './src/components/AppHeader';
import ControlsBar from './src/components/ControlsBar';
import FilterTabs from './src/components/FilterTabs';
import SearchBar from './src/components/SearchBar';
import GoalCard from './src/components/GoalCard';
import EmptyState from './src/components/EmptyState';
import AddGoalModal from './src/components/AddGoalModal';
import GoalDetailModal from './src/components/GoalDetailModal';
import StatsModal from './src/components/StatsModal';
import CalendarModal from './src/components/CalendarModal';
import Toast from './src/components/Toast';
import SideDrawer from './src/components/SideDrawer';
import FolderPickerModal from './src/components/FolderPickerModal';
import CounterModal from './src/components/CounterModal';
import { useCounterRecords } from './src/hooks/useCounterRecords';
import AdBannerComponent from './src/components/AdBannerComponent';
import { useFolders } from './src/hooks/useFolders';
import {
  setupNotifications,
  scheduleGoalNotifications,
  cancelGoalNotifications,
} from './src/utils/notifications';

function AppContent({ onRestore }) {
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();

  const {
    folders,
    activeFolderId,
    setActiveFolderId,
    addFolder,
    renameFolder,
    deleteFolder,
    getLocalizedFolders,
  } = useFolders();

  const localizedFolders = getLocalizedFolders(t);
  const activeFolder = localizedFolders.find(f => f.id === activeFolderId) ?? null;

  const {
    goals,
    rawGoals,
    loaded,
    sortBy, setSortBy,
    filterBy, setFilterBy,
    searchQuery, setSearchQuery,
    addGoal,
    updateGoal,
    toggleComplete,
    togglePin,
    deleteGoal,
    moveGoalsToDefaultFolder,
    addUpdate,
    editUpdate,
    deleteUpdate,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    totalCount,
    dueCount,
  } = useGoals(activeFolderId);

  // BUG-14: move goals to default folder before deleting the folder
  const handleDeleteFolder = useCallback((id) => {
    moveGoalsToDefaultFolder(id);
    deleteFolder(id);
  }, [moveGoalsToDefaultFolder, deleteFolder]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [counterVisible, setCounterVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const {
    records: counterRecords,
    addRecord, addNote: addCounterNote, editNote: editCounterNote,
    deleteNote: deleteCounterNote, deleteRecord,
  } = useCounterRecords();

  const rawGoalsRef = useRef(rawGoals);
  useEffect(() => { rawGoalsRef.current = rawGoals; }, [rawGoals]);

  // Request notification permissions once on mount
  useEffect(() => { setupNotifications(); }, []);

  const detailGoal = detailGoalId
    ? rawGoals.find(g => g.id === detailGoalId) ?? null
    : null;

  const showToast = useCallback((msg) => setToastMsg(msg), []);

  const handleAddGoal = useCallback((data) => {
    const newGoal = addGoal({ ...data, folderId: activeFolderId ?? 'default' });
    scheduleGoalNotifications(newGoal, t);
    showToast(t('toast.goalAdded'));
  }, [addGoal, showToast, t, activeFolderId]);

  const handleToggleComplete = useCallback((id) => {
    const g = rawGoalsRef.current.find(x => x.id === id);
    cancelGoalNotifications(id);
    const newGoal = toggleComplete(id);
    if (newGoal) scheduleGoalNotifications(newGoal, t);
    showToast(g?.completed ? t('toast.undone') : t('toast.goalCompleted'));
  }, [toggleComplete, showToast, t]);

  const handleTogglePin = useCallback((id) => {
    const g = rawGoalsRef.current.find(x => x.id === id);
    togglePin(id);
    showToast(g?.pinned ? t('toast.unpinned') : t('toast.pinned'));
  }, [togglePin, showToast, t]);

  const handleDelete = useCallback((id) => {
    cancelGoalNotifications(id);
    deleteGoal(id);
    showToast(t('toast.goalDeleted'));
  }, [deleteGoal, showToast, t]);

  const handleUpdateGoal = useCallback((id, data) => {
    updateGoal(id, data);
    const existing = rawGoalsRef.current.find(g => g.id === id);
    if (existing) scheduleGoalNotifications({ ...existing, ...data }, t);
    showToast(t('toast.goalUpdated'));
  }, [updateGoal, showToast, t]);

  const handleAddUpdate = useCallback((goalId, text) => {
    addUpdate(goalId, text);
    showToast(t('toast.noteAdded'));
  }, [addUpdate, showToast, t]);

  const handleEditUpdate = useCallback((goalId, updateId, text) => {
    editUpdate(goalId, updateId, text);
    showToast(t('toast.noteUpdated'));
  }, [editUpdate, showToast, t]);

  const handleDeleteUpdate = useCallback((goalId, updateId) => {
    deleteUpdate(goalId, updateId);
    showToast(t('toast.noteDeleted'));
  }, [deleteUpdate, showToast, t]);

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
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <RNStatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.surface}
        translucent={false}
      />

      <View style={styles.topFixed}>
        <AppHeader
          totalCount={totalCount}
          dueCount={dueCount}
          onMenuPress={() => setDrawerVisible(true)}
          folderName={activeFolder?.name ?? t('folder.all')}
          onFolderPress={() => setFolderPickerVisible(true)}
        />
        <ControlsBar
          sortBy={sortBy}
          onSortChange={setSortBy}
          onAddPress={() => setAddModalVisible(true)}
        />
        <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
        <FilterTabs filterBy={filterBy} onFilterChange={setFilterBy} />
      </View>

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

      <AdBannerComponent />

      <AddGoalModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onSubmit={handleAddGoal}
      />

      <GoalDetailModal
        goal={detailGoal}
        visible={!!detailGoal}
        onClose={() => setDetailGoalId(null)}
        onUpdateGoal={handleUpdateGoal}
        onAddUpdate={handleAddUpdate}
        onEditUpdate={handleEditUpdate}
        onDeleteUpdate={handleDeleteUpdate}
        onAddSubtask={addSubtask}
        onToggleSubtask={toggleSubtask}
        onDeleteSubtask={deleteSubtask}
      />

      <StatsModal
        visible={statsVisible}
        onClose={() => setStatsVisible(false)}
        goals={rawGoals}
      />

      <CalendarModal
        visible={calendarVisible}
        onClose={() => setCalendarVisible(false)}
        goals={rawGoals}
      />

      <Toast message={toastMsg} onHide={() => setToastMsg(null)} />

      <SideDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onStatsPress={() => setStatsVisible(true)}
        onCalendarPress={() => setCalendarVisible(true)}
        onCounterPress={() => setCounterVisible(true)}
        onRestoreSuccess={() => { setDrawerVisible(false); onRestore(); }}
        folders={localizedFolders}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onManageFolders={() => setFolderPickerVisible(true)}
      />

      <CounterModal
        visible={counterVisible}
        onClose={() => setCounterVisible(false)}
        records={counterRecords}
        onAddRecord={addRecord}
        onAddNote={addCounterNote}
        onEditNote={editCounterNote}
        onDeleteNote={deleteCounterNote}
        onDeleteRecord={deleteRecord}
      />

      <FolderPickerModal
        visible={folderPickerVisible}
        onClose={() => setFolderPickerVisible(false)}
        folders={localizedFolders}
        activeFolderId={activeFolderId}
        onSelectFolder={setActiveFolderId}
        onAddFolder={addFolder}
        onRenameFolder={renameFolder}
        onDeleteFolder={handleDeleteFolder}
      />
    </View>
  );
}

export default function App() {
  const [reloadKey, setReloadKey] = useState(0);
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent key={reloadKey} onRestore={() => setReloadKey(k => k + 1)} />
      </LanguageProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingTop: Constants.statusBarHeight ?? (Platform.OS === 'android' ? (RNStatusBar.currentHeight ?? 24) : 44),
  },
  topFixed: {
    flexShrink: 0,
  },
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
