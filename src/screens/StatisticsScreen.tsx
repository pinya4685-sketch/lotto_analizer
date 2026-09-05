/**
 * 통계 자료 리스트 및 12가지 세부 통계 화면 (StatisticsScreen)
 * - 1. 번호별 출현 횟수 통계: 1~45번 1239회 누적 출현 랭킹 및 횟수 시각화
 * - 2. 연속 미출현 번호 통계: 최신 1239회 기준 번호별 연속 미출현 주수(Cold numbers) 시각화
 * - 3. 홀수-짝수 출현 통계: 각 회차별 홀:짝 비율(예: 홀 3 : 짝 3) 및 분포 뱃지
 * - 4. 연속 번호 통계: 각 회차별 연속된 번호(ex: 11-12) 하이라이트 및 쌍 수 집계
 * - 5. 이월수 통계: 직전 회차 이월 번호 하이라이트
 * - 6. 번호합 통계: 6개 번호 총합 지표
 * - 7. 앞수합 통계: 앞수 공 3개만 색상 표기 (뒷수 3개 딤, 보너스볼 제외)
 * - 8. 뒷수합 통계: 뒤에 공 3개만 색상 표기 (앞수 3개 딤, 보너스볼 제외)
 * - 9~11. 첫수/끝수/AC 통계
 * - 12. OMR 공간 분산 패턴
 * - FlatList 초고속 가상화 및 O(1) 해시 인덱싱 완비
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
import { ChevronRight, ArrowLeft, TrendingUp, X, ArrowUpDown, Flame, Snowflake, Award } from 'lucide-react-native';
import { LottoRecord } from '../data/lottoData';

// ── 12가지 통계 카테고리 정적 목록 ──
const STATS_CATEGORIES = [
  { id: 1, title: '1. 번호별 출현 횟수 통계', desc: '1~45번 각 번호별 1239개 회차 누적 출현 횟수 랭킹' },
  { id: 2, title: '2. 연속 미출현 번호 통계', desc: '최신 1239회 기준 각 번호별 연속 미출현 주수 (Cold Numbers)' },
  { id: 3, title: '3. 홀수 - 짝수 출현 통계', desc: '각 회차별 홀수:짝수 비율 (3:3, 4:2, 2:4 등) 분석' },
  { id: 4, title: '4. 연속 번호 통계', desc: '연속된 번호 (ex: 11, 12) 출현 회차 및 연속수 하이라이트' },
  { id: 5, title: '5. 이월수 통계', desc: '직전 회차에서 당 회차로 이월된 공만 밝게 하이라이트 딤처리' },
  { id: 6, title: '6. 번호합 통계', desc: '6개 번호 총합 115~135 표준 퀀트 구간 분석' },
  { id: 7, title: '7. 앞수합 통계', desc: '앞 3개 번호(1~3번)만 컬러 표기 및 합계 분석 (보너스 제외)' },
  { id: 8, title: '8. 뒷수합 통계', desc: '뒤 3개 번호(4~6번)만 컬러 표기 및 합계 분석 (보너스 제외)' },
  { id: 9, title: '9. 첫수합 통계', desc: '첫 번호 (1번 공) 전용 지표 분석' },
  { id: 10, title: '10. 끝수합 통계', desc: '6개 번호 끝수(0~9) 합계 (예: 20~35점) 모멘텀 분석' },
  { id: 11, title: '11. AC(산술적복잡성) 통계', desc: 'AC 6~10 복잡성 수치별 회차 분포' },
  { id: 12, title: '12. OMR 공간 분산 패턴 통계', desc: '실제 로또 OMR 용지 지그재그 패턴선 시각화' }
];

// O(1) 회차 탐색용 Map 캐시
const DRAW_MAP = new Map<number, LottoRecord>(OFFLINE_DB.map(d => [d.draw, d]));

// ─────────────────────────────────────────────────────────────
// [데이터 집계 1] 1~45번 번호별 출현 횟수 사전 계산
// ─────────────────────────────────────────────────────────────
interface NumberFreqItem {
  num: number;
  count: number;
  bonusCount: number;
  totalCount: number;
  percent: number;
}

const NUMBER_FREQUENCIES: NumberFreqItem[] = (() => {
  const counts: { [key: number]: { count: number; bonusCount: number } } = {};
  for (let i = 1; i <= 45; i++) {
    counts[i] = { count: 0, bonusCount: 0 };
  }
  OFFLINE_DB.forEach(d => {
    d.nums.forEach(n => {
      if (counts[n]) counts[n].count++;
    });
    if (counts[d.bonus]) counts[d.bonus].bonusCount++;
  });
  const totalDraws = OFFLINE_DB.length;
  return Object.keys(counts).map(k => {
    const num = Number(k);
    const count = counts[num].count;
    const bonusCount = counts[num].bonusCount;
    const totalCount = count + bonusCount;
    const percent = Number(((count / totalDraws) * 100).toFixed(1));
    return { num, count, bonusCount, totalCount, percent };
  });
})();

// ─────────────────────────────────────────────────────────────
// [데이터 집계 2] 최신 회차(1239회) 기준 번호별 연속 미출현 주수 계산
// ─────────────────────────────────────────────────────────────
interface ColdNumberItem {
  num: number;
  missWeeks: number;
  lastDraw: number;
}

const COLD_NUMBERS: ColdNumberItem[] = (() => {
  const latestDrawNo = OFFLINE_DB[0]?.draw || 1239;
  const lastDraws: { [key: number]: number } = {};

  for (let i = 1; i <= 45; i++) {
    const found = OFFLINE_DB.find(d => d.nums.includes(i));
    lastDraws[i] = found ? found.draw : 0;
  }

  return Object.keys(lastDraws).map(k => {
    const num = Number(k);
    const lastDraw = lastDraws[num];
    const missWeeks = latestDrawNo - lastDraw;
    return { num, missWeeks, lastDraw };
  });
})();

// ── 연속 번호(Consecutive) 쌍 검출 함수 ──
function getConsecutiveInfo(nums: number[]) {
  const sorted = [...nums].sort((a, b) => a - b);
  const pairs: number[][] = [];
  const consecutiveSet = new Set<number>();

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i] + 1) {
      pairs.push([sorted[i], sorted[i + 1]]);
      consecutiveSet.add(sorted[i]);
      consecutiveSet.add(sorted[i + 1]);
    }
  }

  return { pairs, consecutiveSet };
}

// ── 홀수 짝수 검출 함수 ──
function getOddEvenInfo(nums: number[]) {
  const oddCount = nums.filter(n => n % 2 !== 0).length;
  const evenCount = 6 - oddCount;
  return { oddCount, evenCount };
}

// ─────────────────────────────────────────────────────────────
// [컴포넌트] 1. 번호별 출현 횟수 행
// ─────────────────────────────────────────────────────────────
const NumberFreqRow = React.memo(({
  item,
  rank,
  maxCount,
  dynamicCard,
  dynamicBorder,
  dynamicText,
}: {
  item: NumberFreqItem;
  rank: number;
  maxCount: number;
  dynamicCard: string;
  dynamicBorder: string;
  dynamicText: string;
}) => {
  const progressPct = Math.min(100, Math.round((item.count / maxCount) * 100));
  return (
    <View style={[styles.statItemRow, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
      <View style={styles.rankBadge}>
        <Text style={styles.rankText}>{rank}위</Text>
      </View>
      <LottoBall number={item.num} size={30} />
      <View style={styles.statItemMiddle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[styles.statNumLabel, { color: dynamicText }]}>{item.num}번 공</Text>
          <Text style={styles.statCountText}>
            당첨 <Text style={{ fontWeight: '900', color: COLORS.primary }}>{item.count}회</Text> (보너스 +{item.bonusCount})
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
        </View>
      </View>
      <View style={styles.percentBadge}>
        <Text style={styles.percentText}>{item.percent}%</Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// [컴포넌트] 2. 연속 미출현 번호 행
// ─────────────────────────────────────────────────────────────
const ColdNumberRow = React.memo(({
  item,
  rank,
  maxMiss,
  dynamicCard,
  dynamicBorder,
  dynamicText,
}: {
  item: ColdNumberItem;
  rank: number;
  maxMiss: number;
  dynamicCard: string;
  dynamicBorder: string;
  dynamicText: string;
}) => {
  const isZero = item.missWeeks === 0;
  const progressPct = Math.min(100, Math.max(8, Math.round((item.missWeeks / Math.max(maxMiss, 1)) * 100)));

  return (
    <View style={[styles.statItemRow, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
      <View style={[styles.rankBadge, isZero && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
        <Text style={[styles.rankText, isZero && { color: COLORS.neonGreen }]}>
          {isZero ? '당첨' : `${rank}위`}
        </Text>
      </View>
      <LottoBall number={item.num} size={30} />
      <View style={styles.statItemMiddle}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={[styles.statNumLabel, { color: dynamicText }]}>{item.num}번 공</Text>
          <Text style={[styles.statCountText, { color: isZero ? COLORS.neonGreen : COLORS.textSecondary }]}>
            {isZero ? '최신 1239회차 당첨' : `마지막 출현: ${item.lastDraw}회`}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${progressPct}%`, 
                backgroundColor: isZero ? COLORS.neonGreen : (item.missWeeks >= 10 ? '#EF4444' : COLORS.primary) 
              }
            ]} 
          />
        </View>
      </View>
      <View style={[styles.coldBadge, isZero && styles.coldBadgeActive]}>
        <Text style={[styles.coldBadgeText, isZero && { color: COLORS.neonGreen }]}>
          {isZero ? '이번주 출현' : `${item.missWeeks}주 연속`}
        </Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// [컴포넌트] 회차별 컴팩트 단일 행 (카테고리 3, 4, 5, 6, 7, 8, 9, 10, 11 대응)
// ─────────────────────────────────────────────────────────────
const CompactUniversalDrawRow = React.memo(({
  item,
  statId,
  dynamicCard,
  dynamicBorder,
  dynamicText,
}: {
  item: LottoRecord;
  statId: number;
  dynamicCard: string;
  dynamicBorder: string;
  dynamicText: string;
}) => {
  let badgeText = '';
  let badgeColor = COLORS.primary;
  let badgeBg = 'rgba(37, 99, 235, 0.12)';
  let showBonus = true;

  // 3. 홀수-짝수 통계
  if (statId === 3) {
    const { oddCount, evenCount } = getOddEvenInfo(item.nums);
    badgeText = `홀 ${oddCount} : 짝 ${evenCount}`;
    badgeColor = oddCount === 3 ? COLORS.neonGreen : COLORS.primary;
    badgeBg = oddCount === 3 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(37, 99, 235, 0.12)';
  } 
  // 4. 연속 번호 통계
  else if (statId === 4) {
    const { pairs } = getConsecutiveInfo(item.nums);
    if (pairs.length > 0) {
      const pairStrs = pairs.map(p => `${p[0]}-${p[1]}`).join(', ');
      badgeText = `연속 ${pairs.length}쌍 (${pairStrs})`;
      badgeColor = '#EF4444';
      badgeBg = 'rgba(239, 68, 68, 0.12)';
    } else {
      badgeText = '연속수 없음';
      badgeColor = COLORS.textMuted;
      badgeBg = 'rgba(148, 163, 184, 0.12)';
    }
  } 
  // 5. 이월수 통계
  else if (statId === 5) {
    const prevDraw = DRAW_MAP.get(item.draw - 1);
    const carryNums = prevDraw ? item.nums.filter(n => prevDraw.nums.includes(n)) : [];
    if (carryNums.length > 0) {
      badgeText = `이월 ${carryNums.length}개 (${carryNums.join(',')})`;
      badgeColor = COLORS.neonGreen;
      badgeBg = 'rgba(16, 185, 129, 0.15)';
    } else {
      badgeText = '이월 0개';
      badgeColor = COLORS.textMuted;
      badgeBg = 'rgba(148, 163, 184, 0.12)';
    }
  } 
  // 7. 앞수합 통계 (앞 3개 공만 색상, 보너스 미표시)
  else if (statId === 7) {
    showBonus = false;
    const frontSum = item.nums[0] + item.nums[1] + item.nums[2];
    badgeText = `앞수합 ${frontSum}점`;
    badgeColor = COLORS.accentBlue;
    badgeBg = 'rgba(14, 165, 233, 0.15)';
  } 
  // 8. 뒷수합 통계 (뒤 3개 공만 색상, 보너스 미표시)
  else if (statId === 8) {
    showBonus = false;
    const backSum = item.nums[3] + item.nums[4] + item.nums[5];
    badgeText = `뒷수합 ${backSum}점`;
    badgeColor = COLORS.primary;
    badgeBg = 'rgba(37, 99, 235, 0.15)';
  } 
  // 9. 첫수합 통계
  else if (statId === 9) {
    badgeText = `첫수 ${item.nums[0]}번`;
    badgeColor = COLORS.neonYellow;
    badgeBg = 'rgba(245, 158, 11, 0.15)';
  } 
  // 10. 끝수합 통계
  else if (statId === 10) {
    const endingDigitSum = item.nums.reduce((acc: number, n: number) => acc + getEndingDigit(n), 0);
    badgeText = `끝수합 ${endingDigitSum}점`;
    badgeColor = COLORS.neonGreen;
    badgeBg = 'rgba(16, 185, 129, 0.15)';
  } 
  // 11. AC 통계
  else if (statId === 11) {
    const ac = calculateACValue(item.nums);
    badgeText = `AC ${ac}`;
    badgeColor = COLORS.accentBlue;
    badgeBg = 'rgba(14, 165, 233, 0.15)';
  } 
  // 6. 번호합 통계 (기본)
  else {
    const totalSum = item.nums.reduce((a: number, b: number) => a + b, 0);
    badgeText = `합 ${totalSum}점`;
    badgeColor = COLORS.primary;
    badgeBg = 'rgba(37, 99, 235, 0.12)';
  }

  // ── 공별 하이라이트/딤 투명도 계산 ──
  const prevDraw = statId === 5 ? DRAW_MAP.get(item.draw - 1) : null;
  const carryNums = prevDraw ? item.nums.filter(n => prevDraw.nums.includes(n)) : [];
  const { consecutiveSet } = statId === 4 ? getConsecutiveInfo(item.nums) : { consecutiveSet: new Set<number>() };

  const getBallOpacity = (index: number, num: number) => {
    // 앞수합: 앞 3개(0,1,2)만 1.0, 뒤 3개(3,4,5)는 0.25
    if (statId === 7) return index < 3 ? 1.0 : 0.25;
    // 뒷수합: 뒤 3개(3,4,5)만 1.0, 앞 3개(0,1,2)는 0.25
    if (statId === 8) return index >= 3 ? 1.0 : 0.25;
    // 이월수: 이월된 번호만 1.0
    if (statId === 5) return carryNums.includes(num) ? 1.0 : 0.25;
    // 연속번호: 연속된 쌍 번호만 1.0
    if (statId === 4) return consecutiveSet.has(num) ? 1.0 : 0.25;
    // 홀짝/기타: 전체 1.0
    return 1.0;
  };

  return (
    <View style={[styles.compactSingleRow, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
      <Text style={[styles.compactDrawNo, { color: dynamicText }]}>{item.draw}회</Text>

      <View style={styles.compactBallsRow}>
        {item.nums.map((n: number, idx: number) => (
          <View key={n} style={{ opacity: getBallOpacity(idx, n) }}>
            <LottoBall number={n} size={26} />
          </View>
        ))}

        {/* 앞수합, 뒷수합은 보너스 번호 미표시 */}
        {showBonus && (
          <>
            <Text style={styles.compactPlus}>+</Text>
            <View style={{ opacity: statId === 5 || statId === 4 ? 0.25 : 1.0 }}>
              <LottoBall number={item.bonus} size={26} isBonus />
            </View>
          </>
        )}
      </View>

      <View style={[styles.compactMetricBadge, { backgroundColor: badgeBg }]}>
        <Text style={[styles.compactMetricText, { color: badgeColor }]}>{badgeText}</Text>
      </View>
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// [메인 컴포넌트] StatisticsScreen
// ─────────────────────────────────────────────────────────────
export const StatisticsScreen: React.FC = () => {
  const { isDarkMode } = useLotto();
  const [selectedStatId, setSelectedStatId] = useState<number | null>(null);
  const [showTrendModal, setShowTrendModal] = useState<boolean>(false);
  const [omrSelectedDrawIndex, setOmrSelectedDrawIndex] = useState<number>(0);
  
  // 정렬 상태
  const [isAscending, setIsAscending] = useState<boolean>(false); // 최신순(false) / 과거순(true)
  const [isSortByNumber, setIsSortByNumber] = useState<boolean>(false); // 랭킹순(false) / 번호순(true)

  // 테마 색상
  const dynamicBg = isDarkMode ? '#0F172A' : COLORS.background;
  const dynamicCard = isDarkMode ? '#1E293B' : COLORS.cardBg;
  const dynamicText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const dynamicBorder = isDarkMode ? '#334155' : COLORS.border;

  // 전체 회차 정렬 메모이제이션
  const displayDraws = useMemo(() => {
    return isAscending ? [...OFFLINE_DB].reverse() : OFFLINE_DB;
  }, [isAscending]);

  // 1. 번호별 출현 횟수 데이터 정렬 (출현순 vs 번호순)
  const sortedFreqData = useMemo(() => {
    const list = [...NUMBER_FREQUENCIES];
    if (isSortByNumber) {
      return list.sort((a, b) => a.num - b.num);
    }
    return list.sort((a, b) => b.count - a.count);
  }, [isSortByNumber]);

  const maxFreqCount = useMemo(() => {
    return Math.max(...NUMBER_FREQUENCIES.map(f => f.count), 1);
  }, []);

  // 2. 연속 미출현 번호 데이터 정렬 (미출현주수 순 vs 번호순)
  const sortedColdData = useMemo(() => {
    const list = [...COLD_NUMBERS];
    if (isSortByNumber) {
      return list.sort((a, b) => a.num - b.num);
    }
    return list.sort((a, b) => b.missWeeks - a.missWeeks);
  }, [isSortByNumber]);

  const maxMissWeeks = useMemo(() => {
    return Math.max(...COLD_NUMBERS.map(c => c.missWeeks), 1);
  }, []);

  // 고정 높이 레이아웃
  const getItemLayout = useCallback((_: any, index: number) => ({
    length: 54,
    offset: 54 * index,
    index,
  }), []);

  const keyExtractor = useCallback((item: LottoRecord) => String(item.draw), []);

  // ── [추세 그래프 모달] ──
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

  // ── [12. OMR 공간 패턴 화면] ──
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

  // ── [상세 공통 헤더] ──
  const renderDetailHeader = (title: string, desc: string, showDrawSort: boolean = true) => {
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
          <Text style={styles.statDetailTitle}>{title}</Text>
          <Text style={styles.statDetailDesc}>{desc}</Text>
        </View>

        {showDrawSort ? (
          <View style={styles.sortHeaderRow}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: dynamicText }}>
              전체 {displayDraws.length}개 회차 정밀 분석
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
        ) : (
          <View style={styles.sortHeaderRow}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: dynamicText }}>
              1~45번 전체 번호 분석 결과
            </Text>
            <TouchableOpacity 
              style={[styles.sortBtn, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
              onPress={() => setIsSortByNumber(!isSortByNumber)}
            >
              <ArrowUpDown color={COLORS.primary} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.sortBtnText, { color: dynamicText }]}>
                {isSortByNumber ? '순위순 보기' : '번호순 보기 (1~45)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // [전용 화면 1] 1. 번호별 출현 횟수 통계 렌더링
  // ─────────────────────────────────────────────────────────────
  const renderNumberFrequencyView = () => {
    const cat = STATS_CATEGORIES[0];
    return (
      <View style={[styles.container, { backgroundColor: dynamicBg }]}>
        <FlatList
          data={sortedFreqData}
          keyExtractor={(item) => String(item.num)}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={() => renderDetailHeader(cat.title, cat.desc, false)}
          contentContainerStyle={{ paddingBottom: 140 }}
          style={{ flex: 1, paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <NumberFreqRow
              item={item}
              rank={index + 1}
              maxCount={maxFreqCount}
              dynamicCard={dynamicCard}
              dynamicBorder={dynamicBorder}
              dynamicText={dynamicText}
            />
          )}
        />
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // [전용 화면 2] 2. 연속 미출현 번호 통계 렌더링
  // ─────────────────────────────────────────────────────────────
  const renderColdNumbersView = () => {
    const cat = STATS_CATEGORIES[1];
    return (
      <View style={[styles.container, { backgroundColor: dynamicBg }]}>
        <FlatList
          data={sortedColdData}
          keyExtractor={(item) => String(item.num)}
          initialNumToRender={15}
          maxToRenderPerBatch={15}
          windowSize={5}
          removeClippedSubviews={true}
          ListHeaderComponent={() => renderDetailHeader(cat.title, cat.desc, false)}
          contentContainerStyle={{ paddingBottom: 140 }}
          style={{ flex: 1, paddingHorizontal: 16 }}
          renderItem={({ item, index }) => (
            <ColdNumberRow
              item={item}
              rank={index + 1}
              maxMiss={maxMissWeeks}
              dynamicCard={dynamicCard}
              dynamicBorder={dynamicBorder}
              dynamicText={dynamicText}
            />
          )}
        />
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────
  // [상세 라우터]
  // ─────────────────────────────────────────────────────────────
  const renderDetailView = () => {
    // 1. 번호별 출현 횟수 통계 전용 뷰
    if (selectedStatId === 1) {
      return renderNumberFrequencyView();
    }
    // 2. 연속 미출현 번호 통계 전용 뷰
    if (selectedStatId === 2) {
      return renderColdNumbersView();
    }
    // 12. OMR 공간 패턴 통계 전용 뷰
    if (selectedStatId === 12) {
      const cat = STATS_CATEGORIES[11];
      return (
        <View style={[styles.container, { backgroundColor: dynamicBg }]}>
          {renderDetailHeader(cat.title, cat.desc, false)}
          {renderOMRPatternDetail()}
        </View>
      );
    }

    // 3(홀짝), 4(연속번호), 5(이월수), 6(합), 7(앞수합), 8(뒷수합), 9, 10, 11 (회차별 리스트 뷰)
    const currentCat = STATS_CATEGORIES.find(c => c.id === selectedStatId) || STATS_CATEGORIES[5];
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
          ListHeaderComponent={() => renderDetailHeader(currentCat.title, currentCat.desc, true)}
          contentContainerStyle={{ paddingBottom: 140 }}
          style={{ flex: 1, paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <CompactUniversalDrawRow
              item={item}
              statId={selectedStatId || 6}
              dynamicCard={dynamicCard}
              dynamicBorder={dynamicBorder}
              dynamicText={dynamicText}
            />
          )}
        />
      </View>
    );
  };

  if (selectedStatId !== null) {
    return renderDetailView();
  }

  // ── [통계 카테고리 메인 목록] ──
  return (
    <ScrollView style={[styles.container, { backgroundColor: dynamicBg }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: dynamicText }]}>12가지 세부 통계 자료 리스트 (총 1239개 회차)</Text>
        <Text style={styles.headerSubtitle}>
          통계 카드를 터치하시면 번호별 출현율, 연속 미출현수, 홀짝 비율, 연속 번호 등 전문 퀀트 데이터를 즉각 확인하실 수 있습니다.
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

  // ── 회차별 1줄 컴팩트 행 ──
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
    minWidth: 72,
    alignItems: 'center',
  },
  compactMetricText: {
    fontSize: 11,
    fontWeight: '900',
  },

  // ── 1번/2번 번호별 통계 전용 행 스타일 ──
  statItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    gap: 10,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  statItemMiddle: {
    flex: 1,
  },
  statNumLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  statCountText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(148, 163, 184, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
  },
  percentText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
  coldBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  coldBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  coldBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#EF4444',
  },

  // ── 12. OMR 전용 스타일 ──
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
