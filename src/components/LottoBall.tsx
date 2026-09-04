import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LottoBallProps {
  number: number;
  size?: number;
  isBonus?: boolean;
}

export const LottoBall: React.FC<LottoBallProps> = ({ 
  number, 
  size = 36, 
  isBonus = false 
}) => {
  // 번호별 정통 로또 공 바탕색 및 상단 하이라이트 섀도우 톤
  const getBallStyle = (num: number) => {
    if (num >= 1 && num <= 10) return { bg: '#F59E0B', border: '#D97706', highlight: '#FBBF24' }; // Yellow
    if (num >= 11 && num <= 20) return { bg: '#2563EB', border: '#1D4ED8', highlight: '#60A5FA' }; // Blue
    if (num >= 21 && num <= 30) return { bg: '#EF4444', border: '#DC2626', highlight: '#F87171' }; // Red
    if (num >= 31 && num <= 40) return { bg: '#64748B', border: '#475569', highlight: '#94A3B8' }; // Gray
    return { bg: '#10B981', border: '#059669', highlight: '#34D399' }; // Green (41~45)
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
          borderWidth: isBonus ? 2 : 1.2,
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
};

const styles = StyleSheet.create({
  ballContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
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
    color: '#FFFFFF', // 가독성 극대화를 위한 선명한 볼드 화이트
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  }
});
