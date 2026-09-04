import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { useLotto } from '../context/LottoContext';
import { COLORS } from '../constants/theme';
import { PieChart, Activity, ShieldCheck, Zap } from 'lucide-react-native';

export const VisualizationScreen: React.FC = () => {
  const { pipelineStats, isDarkMode } = useLotto();

  // 가변 테마 색상
  const dynamicBg = isDarkMode ? '#0F172A' : COLORS.background;
  const dynamicCard = isDarkMode ? '#1E293B' : COLORS.cardBg;
  const dynamicText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const dynamicBorder = isDarkMode ? '#334155' : COLORS.border;

  const totalCombinations = 8145060;
  const afterDeathZone = pipelineStats ? pipelineStats.afterDeathZoneCount : 4500000;
  const afterQuantFilter = pipelineStats ? pipelineStats.afterQuantFiltersCount : 285000;

  return (
    <ScrollView style={[styles.container, { backgroundColor: dynamicBg }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: dynamicText }]}>확률 파이프라인 시각화</Text>
        <Text style={styles.headerSubtitle}>
          8,145,060개 전체 수형도에서 퀀트 필터를 통해 압축 수렴되는 단계별 시각화
        </Text>
      </View>

      {/* 3단계 파이프라인 바 게이지 시각화 */}
      <View style={[styles.pipelineVisualCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
        <Text style={[styles.cardTitle, { color: dynamicText }]}>단계별 확률 스펙트럼 수렴도</Text>

        <View style={styles.stageBox}>
          <View style={styles.stageHeader}>
            <Text style={[styles.stageName, { color: dynamicText }]}>1단계: 초기 전체 경우의 수 (814만 개)</Text>
            <Text style={styles.stageVal}>100%</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: '100%', backgroundColor: COLORS.primary }]} />
          </View>
        </View>

        <View style={styles.stageBox}>
          <View style={styles.stageHeader}>
            <Text style={[styles.stageName, { color: dynamicText }]}>2단계: Death Zone 삭제 후 ({afterDeathZone.toLocaleString()}개)</Text>
            <Text style={[styles.stageVal, { color: COLORS.accentBlue }]}>
              {((afterDeathZone / totalCombinations) * 100).toFixed(1)}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View 
              style={[
                styles.barFill, 
                { width: `${Math.max(15, (afterDeathZone / totalCombinations) * 100)}%` as any, backgroundColor: COLORS.accentBlue }
              ]} 
            />
          </View>
        </View>

        <View style={styles.stageBox}>
          <View style={styles.stageHeader}>
            <Text style={[styles.stageName, { color: dynamicText }]}>3단계: 퀀트 6가지 필터 최종 압축 ({afterQuantFilter.toLocaleString()}개)</Text>
            <Text style={[styles.stageVal, { color: COLORS.neonGreen }]}>
              {((afterQuantFilter / totalCombinations) * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View 
              style={[
                styles.barFill, 
                { width: `${Math.max(8, (afterQuantFilter / totalCombinations) * 100)}%` as any, backgroundColor: COLORS.neonGreen }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* 정보 요약 카드 */}
      <View style={[styles.infoCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
        <View style={styles.infoRow}>
          <ShieldCheck color={COLORS.primary} size={24} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: dynamicText }]}>814만 분의 1 타격 퀀트엔진</Text>
            <Text style={styles.infoDesc}>
              수학적 붕괴 패턴 번호를 최우선 제거하여 실질 당첨 확률을 비약적으로 끌어올립니다.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 140,
  },
  header: {
    marginBottom: 16,
    marginTop: 6,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pipelineVisualCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 16,
  },
  stageBox: {
    marginBottom: 14,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  stageName: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageVal: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
  barTrack: {
    height: 12,
    backgroundColor: '#E2E8F0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  infoCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  infoDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  }
});
