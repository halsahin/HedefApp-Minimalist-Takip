import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId, calcRemainingDays } from '../utils/dateUtils';
import { TURKISH_LABEL_TO_KEY } from '../constants/categories';

const STORAGE_KEY_V1 = 'goaltracker_v1';
const STORAGE_KEY_V2 = 'goaltracker_v2';

function calcProgressFromSubtasks(subtasks) {
    if (!subtasks || subtasks.length === 0) return 0;
    return Math.round(subtasks.filter(s => s.completed).length / subtasks.length * 100);
}

function normaliseGoal(g) {
    const migratedCategory = TURKISH_LABEL_TO_KEY[g.category] ?? g.category;
    return {
        updates: [],
        progress: 0,
        subtasks: [],
        recurring: null,
        startDate: null,
        reminderDays: [3, 1],
        folderId: 'default',
        ...g,
        category: migratedCategory,
    };
}

function createNextInstance(goal) {
    const { type, interval } = goal.recurring;
    const base = new Date(goal.deadline + 'T12:00:00');
    const daysToAdd =
        type === 'daily'   ? 1  :
        type === 'weekly'  ? 7  :
        type === 'monthly' ? 30 :
        (Number(interval) || 7);
    base.setDate(base.getDate() + daysToAdd);
    const newDeadline = base.toISOString().slice(0, 10);
    return {
        ...goal,
        id: generateId(),
        completed: false,
        pinned: false,
        createdAt: new Date().toISOString(),
        deadline: newDeadline,
        startDate: goal.deadline,
        progress: 0,
        subtasks: (goal.subtasks || []).map(s => ({ ...s, completed: false })),
        updates: [],
    };
}

export function useGoals(activeFolderId = null) {
    const [goals, setGoals] = useState([]);
    const [sortBy, setSortBy] = useState('days');
    const [filterBy, setFilterBy] = useState('active');
    const [searchQuery, setSearchQuery] = useState('');
    const [loaded, setLoaded] = useState(false);

    // ── Load + migrate from AsyncStorage on mount ──────────────
    useEffect(() => {
        (async () => {
            try {
                let raw = await AsyncStorage.getItem(STORAGE_KEY_V2);
                if (raw) {
                    setGoals(JSON.parse(raw).map(normaliseGoal));
                    return;
                }
                raw = await AsyncStorage.getItem(STORAGE_KEY_V1);
                if (raw) {
                    const migrated = JSON.parse(raw).map(normaliseGoal);
                    await AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(migrated));
                    setGoals(migrated);
                }
            } catch (err) {
                console.error('[useGoals] load error:', err);
            } finally {
                setLoaded(true);
            }
        })();
    }, []);

    // ── Persist to AsyncStorage whenever goals change ──────────
    const isFirstRender = useRef(true);
    useEffect(() => {
        if (!loaded) return;
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        AsyncStorage.setItem(STORAGE_KEY_V2, JSON.stringify(goals)).catch(err => {
            console.error('[useGoals] save error:', err);
        });
    }, [goals, loaded]);

    // ── CRUD: Goals ────────────────────────────────────────────
    const addGoal = useCallback((data) => {
        const goal = normaliseGoal({
            id: generateId(),
            name: data.name.trim(),
            category: data.category,
            deadline: data.deadline,
            startDate: data.startDate || null,
            description: (data.description || '').trim(),
            completed: false,
            pinned: false,
            createdAt: new Date().toISOString(),
            progress: data.progress || 0,
            recurring: data.recurring || null,
            subtasks: data.subtasks || [],
            reminderDays: data.reminderDays ?? [3, 1],
            folderId: data.folderId ?? 'default',
            updates: [],
        });
        setGoals(prev => [goal, ...prev]);
        return goal;
    }, []);

    // Returns new recurring instance if created, else null
    const toggleComplete = useCallback((id) => {
        let newGoal = null;
        setGoals(prev => {
            const goal = prev.find(g => g.id === id);
            if (!goal) return prev;
            const nowCompleted = !goal.completed;
            let updated = prev.map(g =>
                g.id === id ? { ...g, completed: nowCompleted } : g
            );
            if (nowCompleted && goal.recurring) {
                newGoal = createNextInstance(goal);
                updated = [newGoal, ...updated];
            }
            return updated;
        });
        return newGoal;
    }, []);

    const togglePin = useCallback((id) => {
        setGoals(prev =>
            prev.map(g => g.id === id ? { ...g, pinned: !g.pinned } : g)
        );
    }, []);

    const deleteGoal = useCallback((id) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    }, []);

    // BUG-14: Move all goals in a folder to 'default' (called before folder deletion)
    const moveGoalsToDefaultFolder = useCallback((folderId) => {
        setGoals(prev => prev.map(g =>
            (g.folderId ?? 'default') === folderId ? { ...g, folderId: 'default' } : g
        ));
    }, []);

    const updateGoal = useCallback((id, data) => {
        setGoals(prev =>
            prev.map(g =>
                g.id === id
                    ? {
                        ...g,
                        name: data.name.trim(),
                        category: data.category,
                        deadline: data.deadline,
                        startDate: data.startDate !== undefined ? data.startDate : g.startDate,
                        description: (data.description || '').trim(),
                        progress: data.progress !== undefined ? data.progress : g.progress,
                        recurring: data.recurring !== undefined ? data.recurring : g.recurring,
                        reminderDays: data.reminderDays !== undefined ? data.reminderDays : g.reminderDays,
                    }
                    : g
            )
        );
    }, []);

    // ── CRUD: Progress Updates ─────────────────────────────────
    const addUpdate = useCallback((goalId, text) => {
        const entry = { id: generateId(), text: text.trim(), date: new Date().toISOString() };
        setGoals(prev =>
            prev.map(g =>
                g.id === goalId
                    ? { ...g, updates: [entry, ...(g.updates || [])] }
                    : g
            )
        );
    }, []);

    const editUpdate = useCallback((goalId, updateId, newText) => {
        setGoals(prev =>
            prev.map(g =>
                g.id === goalId
                    ? {
                        ...g,
                        updates: (g.updates || []).map(u =>
                            u.id === updateId ? { ...u, text: newText.trim() } : u
                        ),
                    }
                    : g
            )
        );
    }, []);

    const deleteUpdate = useCallback((goalId, updateId) => {
        setGoals(prev =>
            prev.map(g =>
                g.id === goalId
                    ? { ...g, updates: (g.updates || []).filter(u => u.id !== updateId) }
                    : g
            )
        );
    }, []);

    // ── CRUD: Subtasks ─────────────────────────────────────────
    const addSubtask = useCallback((goalId, text) => {
        const entry = { id: generateId(), text: text.trim(), completed: false };
        setGoals(prev =>
            prev.map(g => {
                if (g.id !== goalId) return g;
                const subtasks = [...(g.subtasks || []), entry];
                return { ...g, subtasks, progress: calcProgressFromSubtasks(subtasks) };
            })
        );
    }, []);

    const toggleSubtask = useCallback((goalId, subtaskId) => {
        setGoals(prev =>
            prev.map(g => {
                if (g.id !== goalId) return g;
                const subtasks = (g.subtasks || []).map(s =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                );
                return { ...g, subtasks, progress: calcProgressFromSubtasks(subtasks) };
            })
        );
    }, []);

    const deleteSubtask = useCallback((goalId, subtaskId) => {
        setGoals(prev =>
            prev.map(g => {
                if (g.id !== goalId) return g;
                const subtasks = (g.subtasks || []).filter(s => s.id !== subtaskId);
                return { ...g, subtasks, progress: calcProgressFromSubtasks(subtasks) };
            })
        );
    }, []);

    // ── Derived: sorted + filtered + searched ──────────────────
    const sortedFiltered = (() => {
        let list = [...goals];

        // Klasör filtresi
        if (activeFolderId !== null) {
            list = list.filter(g => (g.folderId ?? 'default') === activeFolderId);
        }

        if (filterBy === 'active')    list = list.filter(g => !g.completed);
        if (filterBy === 'completed') list = list.filter(g => g.completed);
        if (filterBy === 'pinned')    list = list.filter(g => g.pinned);

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(g =>
                g.name.toLowerCase().includes(q) ||
                (g.description || '').toLowerCase().includes(q)
            );
        }

        list.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            switch (sortBy) {
                case 'days':     return calcRemainingDays(a.deadline) - calcRemainingDays(b.deadline);
                case 'date':     return new Date(a.deadline) - new Date(b.deadline);
                case 'category': return a.category.localeCompare(b.category);
                case 'name':     return a.name.localeCompare(b.name, 'tr');
                default:         return 0;
            }
        });

        return list;
    })();

    // ── Stats ──────────────────────────────────────────────────
    const totalCount = goals.length;
    const dueCount = goals.filter(g => {
        if (g.completed) return false;
        const d = calcRemainingDays(g.deadline);
        return d >= 0 && d <= 7;
    }).length;

    return {
        goals: sortedFiltered,
        rawGoals: goals,
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
    };
}
