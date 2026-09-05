/**
 * Web 플랫폼 전용 AdMob 배너 컴포넌트
 * - react-native-google-mobile-ads 네이티브 코드를 웹 번들에서 완전 격리하여 흰 화면(500 에러) 방지
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { Megaphone } from 'lucide-react-native';

export const AdMobBanner: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
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
        [Google AdMob 배너 광고 영역] 실제 스마트폰 및 앱플레이어에서 정상 송출됩니다.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
