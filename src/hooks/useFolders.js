import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateId } from '../utils/dateUtils';

const FOLDERS_KEY = 'goaltracker_folders_v1';

// Sentinel name stored in AsyncStorage — never shown raw to users
export const DEFAULT_FOLDER_ID = 'default';
export const DEFAULT_FOLDER = { id: DEFAULT_FOLDER_ID, name: '__default__' };

function ensureDefault(list) {
    if (!list.find(f => f.id === DEFAULT_FOLDER_ID)) {
        return [DEFAULT_FOLDER, ...list];
    }
    return list;
}

export function useFolders() {
    const [folders, setFolders] = useState([DEFAULT_FOLDER]);
    const [activeFolderId, setActiveFolderId] = useState(DEFAULT_FOLDER_ID);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(FOLDERS_KEY).then(raw => {
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    setFolders(ensureDefault(parsed));
                } catch { /* ignore */ }
            }
            setLoaded(true);
        });
    }, []);

    const isFirstRender = useRef(true);
    useEffect(() => {
        if (!loaded) return;
        if (isFirstRender.current) { isFirstRender.current = false; return; }
        AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)).catch(() => {});
    }, [folders, loaded]);

    const addFolder = useCallback((name) => {
        const folder = { id: generateId(), name: name.trim() };
        setFolders(prev => [...prev, folder]);
        return folder;
    }, []);

    const renameFolder = useCallback((id, name) => {
        setFolders(prev => prev.map(f => f.id === id ? { ...f, name: name.trim() } : f));
    }, []);

    const deleteFolder = useCallback((id) => {
        if (id === DEFAULT_FOLDER_ID) return; // varsayılan silinemez
        setFolders(prev => prev.filter(f => f.id !== id));
        setActiveFolderId(prev => prev === id ? null : prev);
    }, []);

    // BUG-02: Translate the default folder name at render time via the t() function
    const getLocalizedFolders = useCallback((t) => {
        return folders.map(f =>
            f.id === DEFAULT_FOLDER_ID ? { ...f, name: t('folder.default') || 'Hedeflerim' } : f
        );
    }, [folders]);

    return {
        folders,
        activeFolderId,
        setActiveFolderId,
        addFolder,
        renameFolder,
        deleteFolder,
        getLocalizedFolders,
    };
}
