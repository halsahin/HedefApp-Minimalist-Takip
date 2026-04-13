/**
 * app.config.js — dinamik Expo konfigürasyonu
 *
 * AdMob App ID'leri src/config/ads.js'ten okunur (.gitignore'da, GitHub'a gitmez).
 * ads.js yoksa (CI/CD ortamı) test ID'leriyle devam eder.
 */
let ADMOB_ANDROID_APP_ID = 'ca-app-pub-3940256099942544~3347511713'; // fallback: test ID
let ADMOB_IOS_APP_ID = 'ca-app-pub-3940256099942544~1458002511'; // fallback: test ID

try {
    const adsConfig = require('./src/config/ads');
    if (adsConfig.ADMOB_ANDROID_APP_ID) ADMOB_ANDROID_APP_ID = adsConfig.ADMOB_ANDROID_APP_ID;
    if (adsConfig.ADMOB_IOS_APP_ID) ADMOB_IOS_APP_ID = adsConfig.ADMOB_IOS_APP_ID;
} catch {
    // ads.js yoksa (örn. CI/CD) test ID'leriyle devam et
}

module.exports = {
    expo: {
        name: "HedefApp",
        slug: "hedefapp",
        version: "1.2.1",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "automatic",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.r1cha.hedefApp"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            edgeToEdgeEnabled: true,
            package: "com.r1cha.hedefApp",
            versionCode: 4,
            allowBackup: true
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        plugins: [
            [
                "expo-notifications",
                {
                    icon: "./assets/icon.png",
                    color: "#F9E55A"
                }
            ],
            [
                "expo-calendar",
                {
                    calendarPermission: "Allow $(APPNAME) to access your calendar to add goal reminders.",
                    remindersPermission: "Allow $(APPNAME) to access your reminders."
                }
            ],
            [
                "react-native-google-mobile-ads",
                {
                    androidAppId: ADMOB_ANDROID_APP_ID,
                    iosAppId: ADMOB_IOS_APP_ID
                }
            ]
        ],
        extra: {
            eas: {
                projectId: "34e22c90-2e2a-49c2-92ab-ac54f264dfb3"
            }
        }
    }
};
