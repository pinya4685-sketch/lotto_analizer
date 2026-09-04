import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';
import { ADMOB_REAL_IDS } from '../services/adMobService';
import { Megaphone } from 'lucide-react-native';

export const AdMobBanner: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode }) => {
  return (
    <View style={[styles.bannerContainer, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9', borderColor: isDarkMode ? '#334155' : '#CBD5E1' }]}>
      <Megaphone color={COLORS.primary} size={16} style={{ marginRight: 6 }} />
      <Text style={[styles.bannerText, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
        [AdMob Banner] {ADMOB_REAL_IDS.BANNER}
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
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  }
});
