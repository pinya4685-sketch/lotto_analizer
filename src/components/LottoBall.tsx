import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LottoBallProps {
  number: number;
  size?: number;
  isBonus?: boolean;
}

export const LottoBall: React.FC<LottoBallProps> = React.memo(({ 
  number, 
  size = 36, 
  isBonus = false 
}) => {
  // 번호별 정통 로또 공 바탕색 및 상단 하이라이트 섀도우 톤
  const getBallStyle = (num: number) => {
    if (num >= 1 && num <= 10) return { bg: '#F59E0B', border: '#D97706' }; // Yellow
    if (num >= 11 && num <= 20) return { bg: '#2563EB', border: '#1D4ED8' }; // Blue
    if (num >= 21 && num <= 30) return { bg: '#EF4444', border: '#DC2626' }; // Red
    if (num >= 31 && num <= 40) return { bg: '#64748B', border: '#475569' }; // Gray
    return { bg: '#10B981', border: '#059669' }; // Green (41~45)
  };

  const ballStyle = getBallStyle(number);
  const fontSize = Math.max(11, Math.round(size * 0.44));

  return (
    <View
      style={[
        styles.ballContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: ballStyle.bg,
          borderColor: ballStyle.border,
          borderWidth: isBonus ? 2 : 1,
        }
      ]}
    >
      {/* 3D 입체 광택 하이라이트 효과 */}
      <View style={[styles.ballHighlight, { borderRadius: size / 4 }]} />
      
      <Text
        style={[
          styles.ballText,
          {
            fontSize,
          }
        ]}
      >
        {number}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  ballContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    // 모바일 GPU 래스터라이즈 부담 최소화 (경량 섀도우)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    elevation: 1,
  },
  ballHighlight: {
    position: 'absolute',
    top: '12%',
    left: '18%',
    width: '35%',
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  ballText: {
    fontWeight: '900',
    color: '#FFFFFF', // 선명한 볼드 화이트
    textAlign: 'center',
    includeFontPadding: false,
  }
});
