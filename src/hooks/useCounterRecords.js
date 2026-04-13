import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@counter_records_v1';

export function useCounterRecords() {
    const [records, setRecords] = useState([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(raw => {
            if (raw) {
                try { setRecords(JSON.parse(raw)); } catch (_) {}
            }
            setLoaded(true);
        });
    }, []);

    function persist(next) {
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(err => {
            console.error('[useCounterRecords] save error:', err);
        });
    }

    const addRecord = useCallback((record) => {
        setRecords(prev => {
            const next = [record, ...prev];
            persist(next);
            return next;
        });
    }, []);

    const addNote = useCallback((recordId, text) => {
        setRecords(prev => {
            const next = prev.map(r => r.id === recordId ? {
                ...r,
                notes: [...(r.notes || []), {
                    id: Date.now().toString(),
                    text,
                    createdAt: new Date().toISOString(),
                }],
            } : r);
            persist(next);
            return next;
        });
    }, []);

    const editNote = useCallback((recordId, noteId, text) => {
        setRecords(prev => {
            const next = prev.map(r => r.id === recordId ? {
                ...r,
                notes: (r.notes || []).map(n => n.id === noteId ? { ...n, text } : n),
            } : r);
            persist(next);
            return next;
        });
    }, []);

    const deleteNote = useCallback((recordId, noteId) => {
        setRecords(prev => {
            const next = prev.map(r => r.id === recordId ? {
                ...r,
                notes: (r.notes || []).filter(n => n.id !== noteId),
            } : r);
            persist(next);
            return next;
        });
    }, []);

    const deleteRecord = useCallback((recordId) => {
        setRecords(prev => {
            const next = prev.filter(r => r.id !== recordId);
            persist(next);
            return next;
        });
    }, []);

    return { records, loaded, addRecord, addNote, editNote, deleteNote, deleteRecord };
}
