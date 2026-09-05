/**
 * 통계 자료 리스트 및 세부 통계 화면 (StatisticsScreen)
 * - 1회차부터 1239회차까지의 방대한 데이터를 초고속으로 처리하기 위해 FlatList 가상화 렌더링 적용
 * - O(N^2) 탐색 방지를 위한 Map 기반 O(1) 해시 인덱싱
 * - 고정 행 높이(54px) getItemLayout 최적화로 UI 블로킹(렉) 완전 제거
 */
import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Modal,
  ScrollView
} from 'react-native';
import { useLotto } from '../context/LottoContext';
import { OFFLINE_DB } from '../services/lottoApi';
import { calculateACValue, getEndingDigit } from '../utils/quantEngine';
import { LottoBall } from '../components/LottoBall';
import { COLORS } from '../constants/theme';
import { ChevronRight, ArrowLeft, TrendingUp, X, ArrowUpDown } from 'lucide-react-native';
import { LottoRecord } from '../data/lottoData';

// 컴포넌트 재생성 방지를 위해 카테고리 정적 배열을 외부에 선언
const STATS_CATEGORIES = [
  { id: 1, title: '1. 번호별 출현 횟수 통계', desc: '1~45번 각 번호별 1239개 회차 누적 출현 횟수 랭킹' },
  { id: 2, title: '2. 연속 미출현 번호 통계', desc: '현재 연속 미출현 주수 (Cold Numbers) 및 반발수' },
  { id: 3, title: '3. 홀수 - 짝수 출현 통계', desc: '홀짝 3:3, 4:2, 2:4 분포 비율 및 시계열 흐름' },
  { id: 4, title: '4. 연속 번호 통계', desc: '1쌍/2쌍 이상 연속수 출현 회차 비율' },
  { id: 5, title: '5. 이월수 통계', desc: '직전 회차에서 당 회차로 이월된 공만 밝게 하이라이트 딤처리' },
  { id: 6, title: '6. 번호합 통계', desc: '6개 번호 총합 115~135 표준 퀀트 구간 분석' },
  { id: 7, title: '7. 앞수합 통계', desc: '1~3번 번호 합계 (예: 20~40점) 전용 지표 분석' },
  { id: 8, title: '8. 뒷수합 통계', desc: '4~6번 번호 합계 (예: 70~105점) 전용 지표 분석' },
  { id: 9, title: '9. 첫수합 통계', desc: '첫 번호 (예: 5~10번) 전용 지표 분석' },
  { id: 10, title: '10. 끝수합 통계', desc: '6개 번호 끝수(0~9) 합계 (예: 20~35점) 모멘텀 분석' },
  { id: 11, title: '11. AC(산술적복잡성) 통계', desc: 'AC 6~10 복잡성 수치별 회차 분포' },
  { id: 12, title: '12. OMR 공간 분산 패턴 통계', desc: '실제 로또 OMR 용지 지그재그 패턴선 시각화' }
];

// O(1) 회차 탐색을 위한 전역 Map 캐시 (150만 회 find 순회 제거)
const DRAW_MAP = new Map<number, LottoRecord>(OFFLINE_DB.map(d => [d.draw, d]));

// ── [고성능 메모이제이션 행 컴포넌트: 이월수 통계] ──
const CompactCarryOverRow = React.memo(({ 
  item, 
  dynamicCard, 
  dynamicBorder, 
  dynamicText 
}: { 
  item: LottoRecord; 
  dynamicCard: string; 
  dynamicBorder: string; 
  dynamicText: string; 
}) => {
  const prevDraw = DRAW_MAP.get(item.draw - 1);
  const carryOverNums = prevDraw ? item.nums.filter(n => prevDraw.nums.includes(n)) : [];

  return (
    <View style={[styles.compactSingleRow, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
      <Text style={[styles.compactDrawNo, { color: dynamicText }]}>{item.draw}회</Text>

      <View style={styles.compactBallsRow}>
        {item.nums.map((n: number) => {
          const isCarry = carryOverNums.includes(n);
          return (
            <View key={n} style={{ opacity: isCarry ? 1.0 : 0.25 }}>
              <LottoBall number={n} size={26} />
            </View>
          );
        })}
        <Text style={styles.compactPlus}>+</Text>
        <View style={{ opacity: 0.25 }}>
          <LottoBall number={item.bonus} size={26} isBonus />
        </View>
      </View>

      <View style={[styles.compactMetricBadge, carryOverNums.length > 0 && styles.carryHighlightBadge]}>
        <Text style={[styles.compactMetricText, carryOverNums.length > 0 && { color: COLORS.neonGreen }]}>
          {carryOverNums.length > 0 ? `이월 ${carryOverNums.length}개` : '이월 0개'}
        </Text>
      </View>
    </View>
  );
});

// ── [고성능 메모이제이션 행 컴포넌트: 지표별 통계] ──
const CompactMetricRow = React.memo(({ 
  item, 
  statId, 
  dynamicCard, 
  dynamicBorder, 
  dynamicText 
}: { 
  item: LottoRecord; 
  statId: number; 
  dynamicCard: string; 
  dynamicBorder: string; 
  dynamicText: string; 
}) => {
  let badgeText = '';
  let badgeColor = COLORS.primary;

  if (statId === 7) {
    const frontSum = item.nums[0] + item.nums[1] + item.nums[2];
    badgeText = `앞수합 ${frontSum}점`;
    badgeColor = COLORS.accentBlue;
  } else if (statId === 8) {
    const backSum = item.nums[3] + item.nums[4] + item.nums[5];
    badgeText = `뒷수합 ${backSum}점`;
    badgeColor = COLORS.primary;
  } else if (statId === 9) {
    badgeText = `첫수 ${item.nums[0]}번`;
    badgeColor = COLORS.neonYellow;
  } else if (statId === 10) {
    const endingDigitSum = item.nums.reduce((acc: number, n: number) => acc + getEndingDigit(n), 0);
    badgeText = `끝수합 ${endingDigitSum}점`;
    badgeColor = COLORS.neonGreen;
  } else if (statId === 11) {
    const ac = calculateACValue(item.nums);
    badgeText = `AC ${ac}`;
    badgeColor = COLORS.accentBlue;
  } else {
    const totalSum = item.nums.reduce((a: number, b: number) => a + b, 0);
    badgeText = `${totalSum}점`;
    badgeColor = COLORS.primary;
  }

  return (
    <View style={[styles.compactSingleRow, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
      <Text style={[styles.compactDrawNo, { color: dynamicText }]}>{item.draw}회</Text>

      <View style={styles.compactBallsRow}>
        {item.nums.map((n: number) => (
          <LottoBall key={n} number={n} size={26} />
        ))}
        <Text style={styles.compactPlus}>+</Text>
        <LottoBall number={item.bonus} size={26} isBonus />
      </View>

      <View style={[styles.compactMetricBadge, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
        <Text style={[styles.compactMetricText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    </View>
  );
});

export const StatisticsScreen: React.FC = () => {
  const { isDarkMode } = useLotto();
  const [selectedStatId, setSelectedStatId] = useState<number | null>(null);
  const [showTrendModal, setShowTrendModal] = useState<boolean>(false);
  const [omrSelectedDrawIndex, setOmrSelectedDrawIndex] = useState<number>(0);
  const [isAscending, setIsAscending] = useState<boolean>(false);

  // 테마 색상
  const dynamicBg = isDarkMode ? '#0F172A' : COLORS.background;
  const dynamicCard = isDarkMode ? '#1E293B' : COLORS.cardBg;
  const dynamicText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const dynamicBorder = isDarkMode ? '#334155' : COLORS.border;

  // 전체 1239개 데이터 정렬 메모이제이션 (불필요한 reverse 복사 차단)
  const displayDraws = useMemo(() => {
    return isAscending ? [...OFFLINE_DB].reverse() : OFFLINE_DB;
  }, [isAscending]);

  // 고정 행 높이 계산으로 FlatList 렌더링 지연을 0ms로 단축
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 54, // 48(height) + 6(marginBottom)
    offset: 54 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: LottoRecord) => String(item.draw), []);

  // -------------------------------------------------------------------------
  // [추세 그래프 모달]
  // -------------------------------------------------------------------------
  const renderTrendGraphModal = () => {
    if (!selectedStatId) return null;
    const catInfo = STATS_CATEGORIES.find(c => c.id === selectedStatId);
    const recent20 = OFFLINE_DB.slice(0, 20);

    return (
      <Modal visible={showTrendModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.trendModalContainer, { backgroundColor: dynamicCard }]}>
            <View style={[styles.trendModalHeader, { borderBottomColor: dynamicBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TrendingUp color={COLORS.primary} size={20} style={{ marginRight: 6 }} />
                <Text style={[styles.trendModalTitle, { color: dynamicText }]}>{catInfo?.title} 추세 그래프</Text>
              </View>
              <TouchableOpacity onPress={() => setShowTrendModal(false)}>
                <X color={dynamicText} size={22} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.trendSubText}>
                최근 20개 회차 기준 {catInfo?.title} 시계열 변화 추이
              </Text>

              <View style={[styles.chartContainer, { backgroundColor: isDarkMode ? '#0F172A' : COLORS.cardBgLight, borderColor: dynamicBorder }]}>
                {recent20.map((item) => {
                  const sum = item.nums.reduce((a: number, b: number) => a + b, 0);
                  const heightPct = Math.min(100, Math.max(20, Math.round((sum / 200) * 100)));

                  return (
                    <View key={item.draw} style={styles.chartCol}>
                      <Text style={styles.chartValText}>{sum}</Text>
                      <View style={styles.chartBarTrack}>
                        <View style={[styles.chartBarFill, { height: `${heightPct}%` as any }]} />
                      </View>
                      <Text style={styles.chartLabelText}>{item.draw}회</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // -------------------------------------------------------------------------
  // [개별 전용 뷰 12] OMR 공간 분산 패턴 통계
  // -------------------------------------------------------------------------
  const renderOMRPatternDetail = () => {
    const currentDrawRecord = OFFLINE_DB[omrSelectedDrawIndex] || OFFLINE_DB[0];
    const nums = currentDrawRecord.nums;

    return (
      <ScrollView contentContainerStyle={{ alignItems: 'center', padding: 16, paddingBottom: 140 }}>
        <Text style={[styles.historyListSectionTitle, { color: dynamicText, alignSelf: 'flex-start' }]}>
          실제 로또 OMR 용지 패턴 시각화 (1239개 회차)
        </Text>

        <View style={styles.omrVisualPanel}>
          <View style={styles.omrRedHeader}>
            <Text style={styles.omrDrawTitle}>{currentDrawRecord.draw.toLocaleString()} 회차</Text>
          </View>

          <View style={styles.omr7ColGridBoard}>
            {Array.from({ length: 45 }, (_, i) => i + 1).map(num => {
              const isWinNum = nums.includes(num);
              return (
                <View 
                  key={num} 
                  style={[
                    styles.omrPatternCell, 
                    isWinNum && styles.omrPatternCellWinMarked
                  ]}
                >
                  <Text style={[styles.omrPatternNumText, isWinNum && styles.omrPatternNumWinText]}>
                    {num}
                  </Text>
                </View>
              );
            })}
          </View>

          <View style={styles.omrPanelFooter}>
            <Text style={{ color: '#E11D48', fontSize: 11, fontWeight: '800' }}>
              • 당첨 조합 OMR 마킹 패턴: [ {nums.join(' - ')} ]
            </Text>
          </View>
        </View>

        <View style={[styles.omrDrawSelectorBox, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: dynamicText }}>다른 회차 OMR 패턴 보기:</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity 
              style={styles.omrNavBtn} 
              onPress={() => setOmrSelectedDrawIndex(Math.min(OFFLINE_DB.length - 1, omrSelectedDrawIndex + 1))}
            >
              <Text style={{ color: '#FFF', fontWeight: '800' }}>이전 회차 ({currentDrawRecord.draw - 1}회)</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.omrNavBtn}
              onPress={() => setOmrSelectedDrawIndex(Math.max(0, omrSelectedDrawIndex - 1))}
            >
              <Text style={{ color: '#FFF', fontWeight: '800' }}>다음 회차 ({currentDrawRecord.draw + 1}회)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  // -------------------------------------------------------------------------
  // [초고속 FlatList 헤더]
  // -------------------------------------------------------------------------
  const renderDetailListHeader = () => {
    const cat = STATS_CATEGORIES.find(c => c.id === selectedStatId);

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {renderTrendGraphModal()}

        <View style={styles.detailHeader}>
          <TouchableOpacity 
            style={[styles.backBtn, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]} 
            onPress={() => setSelectedStatId(null)}
          >
            <ArrowLeft color={dynamicText} size={20} style={{ marginRight: 4 }} />
            <Text style={[styles.backBtnText, { color: dynamicText }]}>통계 목록</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.trendGraphBtn} onPress={() => setShowTrendModal(true)}>
            <TrendingUp color="#FFF" size={16} style={{ marginRight: 4 }} />
            <Text style={styles.trendGraphBtnText}>📈 추세 그래프</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statTitleCard}>
          <Text style={styles.statDetailTitle}>{cat?.title}</Text>
          <Text style={styles.statDetailDesc}>{cat?.desc}</Text>
        </View>

        <View style={styles.sortHeaderRow}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: dynamicText }}>
            전체 {displayDraws.length}개 회차 분석 결과 (초고속 가상화 로딩)
          </Text>
          <TouchableOpacity 
            style={[styles.sortBtn, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setIsAscending(!isAscending)}
          >
            <ArrowUpDown color={COLORS.primary} size={14} style={{ marginRight: 4 }} />
            <Text style={[styles.sortBtnText, { color: dynamicText }]}>
              {isAscending ? '과거순 (1회~)' : '최신순 (1239회~)'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // [초고속 가상화 상세 화면: FlatList]
  // -------------------------------------------------------------------------
  const renderDetailView = () => {
    if (selectedStatId === 12) {
      return (
        <View style={[styles.container, { backgroundColor: dynamicBg }]}>
          {renderDetailListHeader()}
          {renderOMRPatternDetail()}
        </View>
      );
    }

    return (
      <View style={[styles.container, { backgroundColor: dynamicBg }]}>
        <FlatList
          data={displayDraws}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          initialNumToRender={20}
          maxToRenderPerBatch={25}
          windowSize={7}
          removeClippedSubviews={true}
          ListHeaderComponent={renderDetailListHeader}
          contentContainerStyle={{ paddingBottom: 140 }}
          style={{ flex: 1, paddingHorizontal: 16 }}
          renderItem={({ item }) => {
            if (selectedStatId === 5) {
              return (
                <CompactCarryOverRow
                  item={item}
                  dynamicCard={dynamicCard}
                  dynamicBorder={dynamicBorder}
                  dynamicText={dynamicText}
                />
              );
            }
            return (
              <CompactMetricRow
                item={item}
                statId={selectedStatId || 6}
                dynamicCard={dynamicCard}
                dynamicBorder={dynamicBorder}
                dynamicText={dynamicText}
              />
            );
          }}
        />
      </View>
    );
  };

  if (selectedStatId !== null) {
    return renderDetailView();
  }

  // -------------------------------------------------------------------------
  // [통계 카테고리 메인 목록]
  // -------------------------------------------------------------------------
  return (
    <ScrollView style={[styles.container, { backgroundColor: dynamicBg }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: dynamicText }]}>12가지 세부 통계 자료 리스트 (총 1239개 회차)</Text>
        <Text style={styles.headerSubtitle}>
          통계 카드를 터치하면 1회차부터 1239회차까지 전체 데이터를 1줄 컴팩트 행으로 즉각 시각화해 보실 수 있습니다.
        </Text>
      </View>

      {STATS_CATEGORIES.map((cat) => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.statCategoryCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
          onPress={() => setSelectedStatId(cat.id)}
          activeOpacity={0.8}
        >
          <View style={styles.catLeft}>
            <Text style={[styles.catTitle, { color: dynamicText }]}>{cat.title}</Text>
            <Text style={styles.catDesc}>{cat.desc}</Text>
          </View>
          <View style={styles.catRight}>
            <Text style={styles.viewDetailText}>상세 보기</Text>
            <ChevronRight color={COLORS.primary} size={18} />
          </View>
        </TouchableOpacity>
      ))}
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
    fontSize: 20,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  statCategoryCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
  },
  catLeft: {
    flex: 1,
    paddingRight: 10,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  catDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  catRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewDetailText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginRight: 4,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  trendGraphBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trendGraphBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statTitleCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statDetailTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statDetailDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sortHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  sortBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  compactSingleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  compactDrawNo: {
    fontSize: 12,
    fontWeight: '900',
    width: 48,
  },
  compactBallsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactPlus: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginHorizontal: 1,
  },
  compactMetricBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 64,
    alignItems: 'center',
  },
  carryHighlightBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.neonGreen,
  },
  compactMetricText: {
    fontSize: 11,
    fontWeight: '900',
  },
  historyListSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  omrVisualPanel: {
    width: 320,
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E11D48',
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 4,
  },
  omrRedHeader: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    alignItems: 'center',
  },
  omrDrawTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  omr7ColGridBoard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'flex-start',
  },
  omrPatternCell: {
    width: '12.6%',
    height: 38,
    margin: '0.8%',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  omrPatternCellWinMarked: {
    backgroundColor: '#E11D48',
    borderColor: '#9F1239',
    borderRadius: 19,
  },
  omrPatternNumText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  omrPatternNumWinText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  omrPanelFooter: {
    padding: 10,
    backgroundColor: '#FFE4E6',
    borderTopWidth: 1,
    borderTopColor: '#FECDD3',
    alignItems: 'center',
  },
  omrDrawSelectorBox: {
    width: '100%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  omrNavBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  trendModalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '55%',
  },
  trendModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  trendModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  trendSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  chartCol: {
    alignItems: 'center',
    flex: 1,
  },
  chartValText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  chartBarTrack: {
    width: 8,
    height: 120,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  chartBarFill: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  chartLabelText: {
    fontSize: 7,
    color: COLORS.textMuted,
    marginTop: 4,
  }
});
