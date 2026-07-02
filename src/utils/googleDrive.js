import { GoogleSignin } from '@react-native-google-signin/google-signin';

// TODO: Kullanıcının Google Cloud'dan alacağı Web Client ID buraya eklenecek
export function configureGoogleSignIn() {
    GoogleSignin.configure({
        webClientId: '830389547706-h21a0qappjac6rhi5hhnr65ror227ucg.apps.googleusercontent.com', 
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
        offlineAccess: false,
    });
}

let tokenPromise = null;

// Access Token alır
export async function getGoogleAccessToken() {
    if (tokenPromise) return tokenPromise;
    tokenPromise = (async () => {
        try {
            const hasPlayServices = await GoogleSignin.hasPlayServices();
            if (!hasPlayServices) throw new Error('Google Play Services yok.');

            let userInfo = await GoogleSignin.getCurrentUser();
            if (!userInfo) {
                userInfo = await GoogleSignin.signIn();
            }
            
            const tokens = await GoogleSignin.getTokens();
            return tokens.accessToken;
        } catch (error) {
            console.error('Google Sign-In Error:', error);
            return null;
        } finally {
            tokenPromise = null;
        }
    })();
    return tokenPromise;
}

// Kullanıcının Google Drive hesabından çıkış yapar
export async function signOutFromGoogle() {
    try {
        await GoogleSignin.signOut();
    } catch (error) {
        console.error('Sign Out Error:', error);
    }
}

export async function getGoogleUserInfo() {
    try {
        const userInfo = await GoogleSignin.getCurrentUser();
        return userInfo ? userInfo.user : null;
    } catch (error) {
        return null;
    }
}

// Drive'da appDataFolder içinde önceden oluşturulmuş yedek dosyası var mı kontrol eder
export async function findBackupFileId(accessToken) {
    try {
        const query = encodeURIComponent("name='hedefapp_backup.json' and 'appDataFolder' in parents and trashed=false");
        const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`;
        
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        
        const data = await response.json();
        if (data.files && data.files.length > 0) {
            return data.files[0].id; // Mevcut dosyanın ID'sini döndür
        }
        return null;
    } catch (error) {
        console.error('Drive Find File Error:', error);
        return null;
    }
}

// JSON verisini Drive'a yükler (Varsa günceller, yoksa yeni oluşturur)
export async function syncToDrive(goalsData, foldersData = []) {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return { success: false, error: 'auth_failed' };

    try {
        const payload = {
            version: 2,
            goals: goalsData,
            folders: foldersData
        };
        const fileContent = JSON.stringify(payload);
        const existingFileId = await findBackupFileId(accessToken);
        
        const fileMetadata = {
            name: 'hedefapp_backup.json',
        };
        // Yalnızca yeni dosya oluştururken parents belirtilmeli
        if (!existingFileId) {
            fileMetadata.parents = ['appDataFolder'];
        }
        
        // React Native Android'de Blob + FormData kullanımı "Network request failed" hatasına yol açar.
        // Bu yüzden multipart body'yi kendimiz manuel olarak string formatında oluşturuyoruz.
        const boundary = 'foo_bar_baz_hedefapp';
        const delimiter = "\r\n--" + boundary + "\r\n";
        const close_delim = "\r\n--" + boundary + "--";

        const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(fileMetadata) +
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            fileContent +
            close_delim;

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (existingFileId) {
            // Dosya zaten varsa üstüne yaz (Update)
            url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
        });

        const data = await response.json();
        return { success: !!data.id };
    } catch (error) {
        console.error('Drive Upload Error:', error);
        return { success: false, error: error.message };
    }
}

// Drive'dan mevcut JSON verisini indirir
export async function downloadFromDrive() {
    const accessToken = await getGoogleAccessToken();
    if (!accessToken) return { success: false, data: null };

    try {
        const fileId = await findBackupFileId(accessToken);
        if (!fileId) return { success: true, data: null }; // Dosya yoksa null dön (yeni kullanıcı)

        // Dosyayı indirirken cache'e takılmamak için zaman damgası ekliyoruz
        const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&_t=${Date.now()}`;
        const response = await fetch(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const textData = await response.text();
        return { success: true, data: JSON.parse(textData) };
    } catch (error) {
        console.error('Drive Download Error:', error);
        return { success: false, data: null };
    }
}
