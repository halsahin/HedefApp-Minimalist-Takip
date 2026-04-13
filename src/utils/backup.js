import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'goaltracker_v2';
const FOLDERS_KEY = 'goaltracker_folders_v1';
const BACKUP_VERSION = 2;

async function getFS() {
    try { return await import('expo-file-system'); } catch { return null; }
}
async function getSharing() {
    try { return await import('expo-sharing'); } catch { return null; }
}
async function getPicker() {
    try { return await import('expo-document-picker'); } catch { return null; }
}

export async function exportBackup() {
    try {
        const [FS, Sharing] = await Promise.all([getFS(), getSharing()]);
        if (!FS || !Sharing) return 'unavailable';

        const [goalsRaw, foldersRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEY),
            AsyncStorage.getItem(FOLDERS_KEY),
        ]);
        const goals = goalsRaw ? JSON.parse(goalsRaw) : [];
        const folders = foldersRaw ? JSON.parse(foldersRaw) : [];

        const payload = JSON.stringify({
            version: BACKUP_VERSION,
            exportedAt: new Date().toISOString(),
            goals,
            folders,
        }, null, 2);

        const fileName = `hedefapp-yedek-${new Date().toISOString().slice(0, 10)}.json`;
        const filePath = FS.cacheDirectory + fileName;

        await FS.writeAsStringAsync(filePath, payload, { encoding: FS.EncodingType.UTF8 });

        const canShare = await Sharing.isAvailableAsync();
        if (!canShare) return 'share_unavailable';

        await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Yedeği Kaydet',
            UTI: 'public.json',
        });

        return 'ok';
    } catch (err) {
        console.warn('[backup] export error:', err);
        return 'error';
    }
}

export async function importBackup() {
    try {
        const [FS, Picker] = await Promise.all([getFS(), getPicker()]);
        if (!FS || !Picker) return { status: 'unavailable' };

        const result = await Picker.getDocumentAsync({
            type: ['application/json', 'text/plain', '*/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets?.[0]) return { status: 'cancelled' };

        const fileUri = result.assets[0].uri;
        const raw = await FS.readAsStringAsync(fileUri, { encoding: FS.EncodingType.UTF8 });

        let data;
        try { data = JSON.parse(raw); } catch {
            return { status: 'invalid' };
        }

        // Hem yeni format (version+goals) hem de eski düz array'i destekle
        const goals = Array.isArray(data) ? data : data?.goals;
        if (!Array.isArray(goals)) return { status: 'invalid' };

        const ops = [AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(goals))];
        if (Array.isArray(data?.folders) && data.folders.length > 0) {
            ops.push(AsyncStorage.setItem(FOLDERS_KEY, JSON.stringify(data.folders)));
        }
        await Promise.all(ops);
        return { status: 'ok', count: goals.length };
    } catch (err) {
        console.warn('[backup] import error:', err);
        return { status: 'error' };
    }
}
