import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Bot, Cpu, Sparkles, Database, ShieldCheck, Zap } from 'lucide-react-native';

interface AiAnalysisBridgeModalProps {
  visible: boolean;
  onFinish: () => void;
  drawNo: number;
  totalDbCount: number;
}

export const AiAnalysisBridgeModal: React.FC<AiAnalysisBridgeModalProps> = ({
  visible,
  onFinish,
  drawNo,
  totalDbCount
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Step 1~23 딥러닝 연산 로그 메시지
  const aiSteps = [
    { title: 'Step 1 ~ 5', desc: `1,239개 오프라인 회차 단기 모멘텀 & 콜드수 트래킹 중...`, progress: 0.25 },
    { title: 'Step 6 ~ 10', desc: `킬 스위치 소각, OMR 세로열 멸종 룰 및 트리거 스캔 중...`, progress: 0.50 },
    { title: 'Step 11 ~ 19', desc: `이웃수 83% 법칙, AC 수축팽창, 극단적 홀짝 회귀 연산 중...`, progress: 0.75 },
    { title: 'Step 20 ~ 23', desc: `8,145,060개 수형도 최종 압축 ➔ 무결점 정규/진성 역발상 10게임 수렴!`, progress: 1.00 }
  ];

  useEffect(() => {
    if (visible) {
      setCurrentStepIndex(0);
      progressAnim.setValue(0);

      // 펄스 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      // 전체 3.5초 (3500ms) AI 고뇌 연산 진행
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3500,
        useNativeDriver: false,
      }).start();

      const timer1 = setTimeout(() => setCurrentStepIndex(1), 900);
      const timer2 = setTimeout(() => setCurrentStepIndex(2), 1800);
      const timer3 = setTimeout(() => setCurrentStepIndex(3), 2700);
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(finishTimer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  const currentStep = aiSteps[currentStepIndex];
  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* AI 딥러닝 CPU 펄스 아이콘 */}
          <Animated.View style={[styles.cpuBadge, { transform: [{ scale: pulseAnim }] }]}>
            <Cpu color={COLORS.primary} size={42} />
          </Animated.View>

          <Text style={styles.titleText}>AI 딥러닝 퀀트 분석 가동 중</Text>
          <Text style={styles.subText}>
            V26.1 MARKOV-QUANT (총 {totalDbCount || 1239}개 회차 빅데이터 분석)
          </Text>

          {/* 프로그레스 바 */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>

          {/* Step 1~23 실시간 연산 로그 디스플레이 */}
          <View style={styles.logCard}>
            <View style={styles.logHeaderRow}>
              <Bot color={COLORS.neonGreen} size={18} style={{ marginRight: 6 }} />
              <Text style={styles.logStepTitle}>{currentStep.title}</Text>
            </View>
            <Text style={styles.logDescText}>{currentStep.desc}</Text>
          </View>

          <View style={styles.footerRow}>
            <ActivityIndicator color={COLORS.primary} size="small" style={{ marginRight: 8 }} />
            <Text style={styles.footerText}>
              8,145,060개 경우의 수 ➔ 퀀트 수형도 최종 압축 중...
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cpuBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
    marginBottom: 20,
  },
  progressTrack: {
    width: '100%',
    height: 10,
    backgroundColor: '#1E293B',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 5,
  },
  logCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16,
  },
  logHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logStepTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.neonGreen,
  },
  logDescText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '700',
  }
});
