import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Colors } from '../constants/theme';
// Reklam ID'leri: önce yerel ads.js'i dene (geliştirme ortamı),
// yoksa EAS Environment Variable'ı kullan (cloud build).
let ANDROID_AD_UNIT_ID = process.env.EXPO_PUBLIC_ANDROID_AD_UNIT_ID ?? null;
let IOS_AD_UNIT_ID = process.env.EXPO_PUBLIC_IOS_AD_UNIT_ID ?? null;
try {
    const adsConfig = require('../config/ads');
    if (adsConfig.ANDROID_AD_UNIT_ID) ANDROID_AD_UNIT_ID = adsConfig.ANDROID_AD_UNIT_ID;
    if (adsConfig.IOS_AD_UNIT_ID) IOS_AD_UNIT_ID = adsConfig.IOS_AD_UNIT_ID;
} catch { /* ads.js yok (EAS build), env var kullanılıyor */ }

// react-native-google-mobile-ads requires a custom dev build / production build.
// In Expo Go it is not available, so we lazy-require and fall back gracefully.
let BannerAd = null;
let BannerAdSize = null;
let TestIds = null;
try {
    const ads = require('react-native-google-mobile-ads');
    BannerAd = ads.BannerAd;
    BannerAdSize = ads.BannerAdSize;
    TestIds = ads.TestIds;
} catch {
    // Expo Go or unsupported environment — ads disabled
}

/**
 * AdBannerComponent — ekranın altında sabit duran reklam bandı.
 *
 * TEST MODU:
 *   Şu an Google'ın resmi test ID'leri kullanılıyor. Gerçek reklamlar
 *   yayına girmez, uygulama asla askıya alınmaz.
 *
 * CANLI YAYINA GEÇİŞ:
 *   1. AdMob konsolunda uygulamanızı kaydedin.
 *   2. Aşağıdaki ANDROID_AD_UNIT_ID ve IOS_AD_UNIT_ID sabitlerini
 *      konsoldan aldığınız gerçek Ad Unit ID'leriyle değiştirin.
 *   3. app.json'daki androidAppId / iosAppId alanlarını da güncelleyin.
 */

const AD_UNIT_ID = Platform.OS === 'android' ? ANDROID_AD_UNIT_ID : IOS_AD_UNIT_ID;


export default function AdBannerComponent() {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Reklam web modunda veya Expo Go'da çalışmaz
    // Geçerli bir Ad Unit ID yoksa sessizce gizle (crash önlenir)
    if (Platform.OS === 'web' || !BannerAd || !AD_UNIT_ID) {
        return <View style={styles.webFallback} />;
    }

    return (
        <View style={styles.container}>
            {/* Reklam yüklenene kadar placeholder yüksekliği korur (layout kayması önlenir) */}
            {!isLoaded && !hasError && <View style={styles.placeholder} />}

            {/* Hata durumunda sessizce gizle, uygulama çökmez */}
            {!hasError && (
                <BannerAd
                    unitId={AD_UNIT_ID}
                    size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                    requestOptions={{
                        requestNonPersonalizedAdsOnly: true, // GDPR uyumu
                    }}
                    onAdLoaded={() => setIsLoaded(true)}
                    onAdFailedToLoad={(error) => {
                        // Hata loglanır ama kullanıcıya yansıtılmaz
                        console.warn('[AdBanner] Reklam yüklenemedi:', error.message);
                        setHasError(true);
                    }}
                />
            )}

            {/* Reklam hatalıysa ince bir border çizgisi dışında hiçbir şey gösterme */}
            {hasError && <View style={styles.errorFallback} />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.surface,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        alignItems: 'center',
        // Minimum yükseklik: reklam yüklenene kadar layout stabil kalır
        minHeight: 52,
        justifyContent: 'center',
    },
    placeholder: {
        height: 50,
        width: '100%',
    },
    // Web build için boş yer tutucu
    webFallback: {
        height: 0,
    },
    // Hata durumunda görünmez ince çizgi — yükseklik 0'a düşer
    errorFallback: {
        height: 0,
    },
});
