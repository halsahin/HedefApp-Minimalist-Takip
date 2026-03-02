import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId, calcRemainingDays } from '../utils/dateUtils';

const STORAGE_KEY = 'goaltracker_v1';

/**
 * Central hook: manages all goal state and AsyncStorage persistence.
 * Replaces the web app's localStorage + DOM-based state.
 *
 * Goal shape:
 * {
 *   id, name, category, deadline, description,
 *   completed, pinned, createdAt,
 *   updates: [{ id, text, date }]   ← gelişim günlüğü
 * }
 */
export function useGoals() {
    const [goals, setGoals] = useState([]);
    const [sortBy, setSortBy] = useState('days');
    const [filterBy, setFilterBy] = useState('all');
    const [loaded, setLoaded] = useState(false);

    // ── Load from AsyncStorage on mount ───────────────────────
    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    // Backwards compat: ensure every goal has an updates array
                    setGoals(parsed.map(g => ({ updates: [], ...g })));
                }
            } catch (error) {
                console.error('[useGoals] AsyncStorage okuma/parse hatası:', error);
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
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals)).catch(error => {
            console.error('[useGoals] AsyncStorage kaydetme hatası:', error);
        });
    }, [goals, loaded]);

    // ── CRUD: Goals ────────────────────────────────────────────
    const addGoal = useCallback((data) => {
        const goal = {
            id: generateId(),
            name: data.name.trim(),
            category: data.category,
            deadline: data.deadline,
            description: (data.description || '').trim(),
            completed: false,
            pinned: false,
            createdAt: new Date().toISOString(),
            updates: [],
        };
        setGoals(prev => [goal, ...prev]);
        return goal;
    }, []);

    const toggleComplete = useCallback((id) => {
        setGoals(prev =>
            prev.map(g => g.id === id ? { ...g, completed: !g.completed } : g)
        );
    }, []);

    const togglePin = useCallback((id) => {
        setGoals(prev =>
            prev.map(g => g.id === id ? { ...g, pinned: !g.pinned } : g)
        );
    }, []);

    const deleteGoal = useCallback((id) => {
        setGoals(prev => prev.filter(g => g.id !== id));
    }, []);

    /**
     * updateGoal — hedefin ana bilgilerini (name, category, deadline, description) günceller.
     * updates dizisine dokunmaz.
     */
    const updateGoal = useCallback((id, data) => {
        setGoals(prev =>
            prev.map(g =>
                g.id === id
                    ? {
                        ...g,
                        name: data.name.trim(),
                        category: data.category,
                        deadline: data.deadline,
                        description: (data.description || '').trim(),
                    }
                    : g
            )
        );
    }, []);

    // ── CRUD: Progress Updates ─────────────────────────────────
    /**
     * addUpdate — hedefin updates dizisine yeni bir kayıt ekler.
     * @param {string} goalId
     * @param {string} text — not içeriği
     */
    const addUpdate = useCallback((goalId, text) => {
        const entry = {
            id: generateId(),
            text: text.trim(),
            date: new Date().toISOString(),
        };
        setGoals(prev =>
            prev.map(g =>
                g.id === goalId
                    ? { ...g, updates: [entry, ...(g.updates || [])] }
                    : g
            )
        );
    }, []);

    /**
     * editUpdate — mevcut bir güncellemenin metnini değiştirir.
     */
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

    /**
     * deleteUpdate — bir güncelleme kaydını siler.
     */
    const deleteUpdate = useCallback((goalId, updateId) => {
        setGoals(prev =>
            prev.map(g =>
                g.id === goalId
                    ? { ...g, updates: (g.updates || []).filter(u => u.id !== updateId) }
                    : g
            )
        );
    }, []);

    // ── Derived: sorted + filtered list ───────────────────────
    const sortedFiltered = (() => {
        let list = [...goals];

        if (filterBy === 'active') list = list.filter(g => !g.completed);
        if (filterBy === 'completed') list = list.filter(g => g.completed);
        if (filterBy === 'pinned') list = list.filter(g => g.pinned);

        list.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            switch (sortBy) {
                case 'days': return calcRemainingDays(a.deadline) - calcRemainingDays(b.deadline);
                case 'date': return new Date(a.deadline) - new Date(b.deadline);
                case 'category': return a.category.localeCompare(b.category, 'tr');
                case 'name': return a.name.localeCompare(b.name, 'tr');
                default: return 0;
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
    };
}
