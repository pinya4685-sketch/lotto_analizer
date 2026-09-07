/**
 * @file AiAnalysisBridgeModal.tsx
 * @description AI 딥러닝 퀀트 분석 진행 브릿지 모달 (스텝 순서별 순차 처리 모션)
 * 1~1240회 빅데이터 스캔부터 10게임 수렴까지 단계별 시각 모션 및 하이테크 피드백 제공
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  ActivityIndicator,
  Platform
} from 'react-native';
import { COLORS } from '../constants/theme';
import { Bot, Cpu, CheckCircle2, CircleDashed, ShieldAlert, Layers, Sparkles } from 'lucide-react-native';

interface AiAnalysisBridgeModalProps {
  visible: boolean;
  onFinish: () => void;
  drawNo: number;
  totalDbCount: number;
}

interface StepItem {
  id: number;
  title: string;
  subtitle: string;
  iconName: string;
}

export const AiAnalysisBridgeModal: React.FC<AiAnalysisBridgeModalProps> = ({
  visible,
  onFinish,
  drawNo,
  totalDbCount
}) => {
  // 현재 활성 스텝 (0: 1단계, 1: 2단계, 2: 3단계, 3: 4단계, 4: 전체 완료)
  const [activeStep, setActiveStep] = useState<number>(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const totalRounds = totalDbCount || 1240;

  // 4단계 퀀트 분석 순차 스텝 정의
  const analysisSteps: StepItem[] = [
    {
      id: 0,
      title: `Step 1. 1~${totalRounds}회 역대 빅데이터 전수 스캔`,
      subtitle: '누적 출현 빈도, 단기 모멘텀 & 미출현 주수(Cold Numbers) 분석',
      iconName: 'database'
    },
    {
      id: 1,
      title: 'Step 2. V26.1 동적 킬 스위치 & 과열 패턴 소각',
      subtitle: '2주 연속 이월수, 끝수 과열 차단 및 OMR 세로열 멸종 룰 가동',
      iconName: 'shield'
    },
    {
      id: 2,
      title: 'Step 3. 23개 심층 퀀트 필터링 & 확률 교차 검증',
      subtitle: '번호합, 앞/뒷수합, AC 복잡성, 홀짝(1:5/6:0 극단치) 회귀 연산',
      iconName: 'filter'
    },
    {
      id: 3,
      title: 'Step 4. 무결점 정규 & 진성 역발상 10게임 수렴',
      subtitle: '8,145,060개 수형도 압축 ➔ 사용자 제외수/포함수 100% 장착 완료',
      iconName: 'sparkles'
    }
  ];

  useEffect(() => {
    if (visible) {
      // 웹 환경에서 aria-hidden 포커스 충돌 방지: 직전 클릭 요소의 포커스 해제
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          (document.activeElement as HTMLElement)?.blur();
        } catch {
          // 브라우저 포커스 해제 예외 무시
        }
      }

      setActiveStep(0);
      progressAnim.setValue(0);

      // CPU 펄스 모션
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 500, useNativeDriver: Platform.OS !== 'web' }),
        ])
      ).start();

      // 프로그레스 바 부드러운 순차 증가 애니메이션 (전체 3.4초)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3400,
        useNativeDriver: false,
      }).start();

      // 순서별 스텝 이동 타이머 (각 단계별로 착착 진행되는 모션)
      const t1 = setTimeout(() => setActiveStep(1), 800);   // Step 2로 전환
      const t2 = setTimeout(() => setActiveStep(2), 1700);  // Step 3으로 전환
      const t3 = setTimeout(() => setActiveStep(3), 2600);  // Step 4로 전환
      const t4 = setTimeout(() => {
        setActiveStep(4); // 전체 완료
      }, 3300);
      const finishTimer = setTimeout(() => {
        onFinish();
      }, 3500);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
        clearTimeout(finishTimer);
      };
    }
  }, [visible]);

  if (!visible) return null;

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          {/* 상단 펄스 아이콘 및 헤더 */}
          <View style={styles.headerRow}>
            <Animated.View style={[styles.cpuBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Cpu color="#6366F1" size={28} />
            </Animated.View>
            <View style={styles.headerTextBox}>
              <Text style={styles.titleText}>AI 딥러닝 퀀트 분석 가동 중</Text>
              <Text style={styles.subText}>
                V26.1 MARKOV-QUANT · 총 {totalRounds}개 회차 연산
              </Text>
            </View>
          </View>

          {/* 프로그레스 바 */}
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressFill, { width: barWidth }]} />
          </View>

          {/* 4단계 순차 모션 스텝 리스트 */}
          <View style={styles.stepListContainer}>
            {analysisSteps.map((step) => {
              const isCompleted = activeStep > step.id;
              const isCurrent = activeStep === step.id;
              const isPending = activeStep < step.id;

              return (
                <View 
                  key={step.id} 
                  style={[
                    styles.stepRowCard,
                    isCurrent && styles.stepRowCardActive,
                    isCompleted && styles.stepRowCardCompleted,
                    isPending && styles.stepRowCardPending,
                  ]}
                >
                  {/* 스텝 상태 인디케이터 (완료: 체크, 진행중: 스피너, 대기: 점) */}
                  <View style={styles.stepIconBox}>
                    {isCompleted ? (
                      <CheckCircle2 color={COLORS.neonGreen} size={20} />
                    ) : isCurrent ? (
                      <ActivityIndicator color={COLORS.primary} size="small" />
                    ) : (
                      <CircleDashed color="#475569" size={18} />
                    )}
                  </View>

                  {/* 스텝 상세 설명 */}
                  <View style={styles.stepInfoBox}>
                    <View style={styles.stepTitleRow}>
                      <Text 
                        style={[
                          styles.stepTitle,
                          isCurrent && styles.stepTitleActive,
                          isCompleted && styles.stepTitleCompleted,
                          isPending && styles.stepTitlePending,
                        ]}
                      >
                        {step.title}
                      </Text>
                      {isCompleted && (
                        <View style={styles.completedBadge}>
                          <Text style={styles.completedBadgeText}>완료</Text>
                        </View>
                      )}
                      {isCurrent && (
                        <View style={styles.processingBadge}>
                          <Text style={styles.processingBadgeText}>분석중</Text>
                        </View>
                      )}
                    </View>
                    <Text 
                      style={[
                        styles.stepSubtitle,
                        isPending && { color: '#475569' }
                      ]}
                      numberOfLines={2}
                    >
                      {step.subtitle}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* 하단 푸터 안내 */}
          <View style={styles.footerRow}>
            <Sparkles color={COLORS.neonYellow} size={15} style={{ marginRight: 6 }} />
            <Text style={styles.footerText}>
              8,145,060개 경우의 수 ➔ 무결점 10게임 도출 중...
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
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#334155',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
        elevation: 10,
      }
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cpuBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTextBox: {
    flex: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  subText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  stepListContainer: {
    gap: 10,
    marginBottom: 18,
  },
  stepRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stepRowCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  stepRowCardCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  stepRowCardPending: {
    opacity: 0.5,
    backgroundColor: '#131D31',
  },
  stepIconBox: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepInfoBox: {
    flex: 1,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E2E8F0',
  },
  stepTitleActive: {
    color: '#818CF8',
    fontWeight: '900',
  },
  stepTitleCompleted: {
    color: COLORS.neonGreen,
  },
  stepTitlePending: {
    color: '#64748B',
  },
  completedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.neonGreen,
  },
  processingBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  processingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#818CF8',
  },
  stepSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 15,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '700',
  }
});

