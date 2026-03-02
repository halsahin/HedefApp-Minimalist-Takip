import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
    BannerAd,
    BannerAdSize,
    TestIds,
} from 'react-native-google-mobile-ads';
import { Colors, Typography } from '../constants/theme';

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
const ANDROID_AD_UNIT_ID = 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'; // Gerçek Android Ad Unit ID
const IOS_AD_UNIT_ID = TestIds.ADAPTIVE_BANNER;                   // → iOS Ad Unit ID ekle

const AD_UNIT_ID = Platform.OS === 'android' ? ANDROID_AD_UNIT_ID : IOS_AD_UNIT_ID;

export default function AdBannerComponent() {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    // Reklam web modunda veya desteklenmeyen ortamda çalışmaz
    if (Platform.OS === 'web') {
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
