/**
 * 구글 애드몹 하단 고정형 배너 광고 컴포넌트
 * - 네이티브 환경(Android/iOS): react-native-google-mobile-ads의 BannerAd 위젯 렌더링
 * - 웹 환경(Browser): 크래시 방지를 위한 대체 배너 렌더링
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { COLORS } from '../constants/theme';
import { getBannerAdUnitId, USE_TEST_ADS } from '../services/adMobService';
import { Megaphone } from 'lucide-react-native';

export const AdMobBanner: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  const [adFailed, setAdFailed] = useState(false);
  const adUnitId = getBannerAdUnitId();

  // 웹 브라우저 환경에서는 네이티브 광고 모듈을 호출할 수 없으므로 대체 뷰 렌더링
  if (Platform.OS === 'web') {
    return (
      <View
        style={[
          styles.bannerContainer,
          {
            backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9',
            borderColor: isDarkMode ? '#334155' : '#CBD5E1',
          },
        ]}
      >
        <Megaphone color={COLORS.primary} size={14} style={{ marginRight: 6 }} />
        <Text style={[styles.bannerText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
          [AdMob Web Preview] {USE_TEST_ADS ? '테스트 배너' : '실제 배너'}
        </Text>
      </View>
    );
  }

  // 광고 로드 실패 시 공간을 어색하게 비우지 않고 안전하게 처리
  if (adFailed) {
    return (
      <View
        style={[
          styles.bannerContainer,
          {
            backgroundColor: isDarkMode ? '#0F172A' : '#F8FAFC',
            borderColor: isDarkMode ? '#1E293B' : '#E2E8F0',
          },
        ]}
      >
        <Text style={[styles.bannerText, { color: isDarkMode ? '#475569' : '#94A3B8' }]}>
          AI 로또 분석기 • 스마트 번호 추천 시스템
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.nativeBannerWrapper,
        {
          backgroundColor: isDarkMode ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDarkMode ? '#334155' : '#CBD5E1',
        },
      ]}
    >
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={(error) => {
          console.log('[AdMob] Banner load failed:', error);
          setAdFailed(true);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  nativeBannerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    minHeight: 50,
  },
  bannerContainer: {
    height: 48,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 12,
  },
  bannerText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
