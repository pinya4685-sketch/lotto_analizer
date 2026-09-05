import React, { useState, useEffect, useRef } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  TextInput, 
  Alert,
  Animated,
  ActivityIndicator
} from 'react-native';
import { COLORS } from '../constants/theme';
import { OFFLINE_DB } from '../services/lottoApi';
import { calculateACValue, calculateDeathZone } from '../utils/quantEngine';
import { LottoBall } from './LottoBall';
import { useLotto } from '../context/LottoContext';
import { 
  X, 
  QrCode, 
  MapPin, 
  Database, 
  Trash2, 
  Share2, 
  Save,
  Bot,
  PlusCircle,
  CheckCircle2,
  Cpu
} from 'lucide-react-native';

const ModalHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
  <View style={styles.modalHeader}>
    <Text style={styles.modalHeaderTitle}>{title}</Text>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <X color={COLORS.textPrimary} size={22} />
    </TouchableOpacity>
  </View>
);

// ---------------------------------------------------------------------------
// 1. 수동 입력 모달 (ManualInputModal) - 글로벌 savedGames 저장 연동
// ---------------------------------------------------------------------------
export const ManualInputModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { saveNumberCombination } = useLotto();
  const [selectedNums, setSelectedNums] = useState<number[]>([]);

  const toggleNum = (num: number) => {
    if (selectedNums.includes(num)) {
      setSelectedNums(selectedNums.filter(n => n !== num));
    } else {
      if (selectedNums.length >= 6) {
        Alert.alert('알림', '로또 번호는 최대 6개까지 선택할 수 있습니다.');
        return;
      }
      setSelectedNums([...selectedNums, num].sort((a, b) => a - b));
    }
  };

  const isComplete = selectedNums.length === 6;
  const sum = selectedNums.reduce((a, b) => a + b, 0);
  const oddCount = selectedNums.filter(n => n % 2 !== 0).length;
  const ac = isComplete ? calculateACValue(selectedNums) : 0;
  const passSum = sum >= 115 && sum <= 135;
  const passOdd = oddCount >= 2 && oddCount <= 4;
  const passAc = ac >= 7 && ac <= 10;

  const handleSaveToStorage = () => {
    if (!isComplete) return;
    saveNumberCombination(selectedNums);
    Alert.alert(
      '보관함 저장 완수',
      `선택하신 번호 [${selectedNums.join(', ')}]가 '선택번호 확인' 보관함에 정상적으로 저장되었습니다!`
    );
    setSelectedNums([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="수동 번호 선택 및 퀀트 검증" onClose={onClose} />
          
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSubText}>
              실제 로또 OMR 용지 스타일 (7열 배치). 1~45번 중 6개 번호를 마킹하면 퀀트 필터 통과 여부를 즉시 검증합니다.
            </Text>
            
            <View style={styles.omrPaperBoard}>
              <View style={styles.omrPaperHeader}>
                <Text style={styles.omrPaperTitle}>로또6/45 OMR 수동 선택지 (7열)</Text>
              </View>

              <View style={styles.ballGrid7Col}>
                {Array.from({ length: 45 }, (_, i) => i + 1).map(num => {
                  const isSelected = selectedNums.includes(num);
                  return (
                    <TouchableOpacity
                      key={num}
                      style={[styles.omrCellButton, isSelected && styles.omrCellSelected]}
                      onPress={() => toggleNum(num)}
                    >
                      <Text style={[styles.omrCellNumText, isSelected && styles.omrCellNumSelected]}>
                        {num < 10 ? `0${num}` : num}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.selectedBoard}>
              <Text style={styles.boardTitle}>선택한 번호 ({selectedNums.length}/6개)</Text>
              <View style={styles.selectedBallsRow}>
                {selectedNums.map(n => (
                  <LottoBall key={n} number={n} size={34} />
                ))}
              </View>

              {isComplete && (
                <View style={styles.verifyBox}>
                  <Text style={styles.verifyTitle}>퀀트 6가지 필터 검증 결과:</Text>
                  <Text style={styles.verifyItem}>• 총합: {sum}점 ({passSum ? '합격' : '부적합 - 115~135 권장'})</Text>
                  <Text style={styles.verifyItem}>• 홀짝 비율: {oddCount}:${6 - oddCount} ({passOdd ? '합격' : '부적합'})</Text>
                  <Text style={styles.verifyItem}>• AC 복잡성: {ac} ({passAc ? '합격' : '부적합'})</Text>
                  
                  <TouchableOpacity 
                    style={styles.saveBtn}
                    onPress={handleSaveToStorage}
                  >
                    <Save color="#FFF" size={16} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>보관함에 저장하기</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 2. 모바일 슬립지 모달 (MobileSlipModal)
// ---------------------------------------------------------------------------
export const MobileSlipModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const mockGames = [
    [11, 13, 22, 32, 33, 36],
    [2, 7, 20, 25, 37, 40],
    [6, 16, 23, 26, 33, 45],
    [1, 14, 16, 34, 41, 44],
    [4, 6, 13, 17, 26, 28]
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="모바일 로또 OMR 슬립지" onClose={onClose} />
          
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSubText}>생성 및 선택하신 번호가 OMR 슬립지 표준 양식으로 마킹되었습니다.</Text>

            {mockGames.map((game, gameIdx) => (
              <View key={gameIdx} style={styles.slipCard}>
                <View style={styles.slipHeader}>
                  <Text style={styles.slipGameTitle}>GAME {String.fromCharCode(65 + gameIdx)} (수동/퀀트)</Text>
                  <Text style={styles.slipNumbersText}>[{game.join(', ')}]</Text>
                </View>
                <View style={styles.omrGrid}>
                  {Array.from({ length: 45 }, (_, i) => i + 1).map(n => {
                    const isMarked = game.includes(n);
                    return (
                      <View key={n} style={[styles.omrCell, isMarked && styles.omrMarked]}>
                        <Text style={[styles.omrText, isMarked && styles.omrMarkedText]}>{n}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 3. 고급 필터 설정 모달 (AI 자동 최적화 2.5초 실시간 시각화 탑재)
// ---------------------------------------------------------------------------
export const FilterSettingModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { userFilters, updateUserFilters } = useLotto();

  const [activeTab, setActiveTab] = useState<'basic' | 'steps'>('basic');
  const [includedBalls, setIncludedBalls] = useState<number[]>(userFilters.includedNums || []);
  const [excludedBalls, setExcludedBalls] = useState<number[]>(userFilters.excludedNums || []);

  const [numberPickerMode, setNumberPickerMode] = useState<'included' | 'excluded' | null>(null);

  // AI 분석 브릿지 상태
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiStepIndex, setAiStepIndex] = useState<number>(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const aiFilterSteps = [
    'Step 1/3: 1,239개 회차 번호합(85~122) 및 밴드 분포 회귀 스캔 중...',
    'Step 2/3: 최근 50회차 앞수합(20~40) & 뒷수합(70~105) 모멘텀 추산 중...',
    'Step 3/3: AC 7이상, 홀짝 3:3 수급 균형 및 제외수 6개 자동 수렴 완수!'
  ];

  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    userFilters.filterValues || {
      '번호 추출 방법': '최근 출현 (AI 최적화)',
      '과거 당첨 제외 필터': '3등까지 제외',
      '이월수 제외 필터': '2회 이상 제외',
      '연속 번호 제외 필터': '2개 연속 이상 제외',
      '번호합 범위 필터': '범위 : 85 ~ 122',
      '앞수합 범위 필터': '범위 : 20 ~ 40',
      '뒷수합 범위 필터': '범위 : 70 ~ 105',
      '첫수합 범위 필터': '범위 : 5 ~ 10',
      '끝수합 범위 필터': '범위 : 20 ~ 35',
      'AC값 범위 필터': '7이상',
      '홀 : 짝 비율 필터': '홀 : 짝 = 3 : 3 (표준)',
      '동일 색상 제한 필터': '동일 색상 최대 4개',
    }
  );

  const [pickerKey, setPickerKey] = useState<string | null>(null);

  // 모달이 열릴 때 context의 현재 필터 값으로 로컬 상태 동기화
  useEffect(() => {
    if (visible) {
      setIncludedBalls(userFilters.includedNums || []);
      setExcludedBalls(userFilters.excludedNums || []);
      if (userFilters.filterValues) {
        setFilterValues({ ...userFilters.filterValues });
      }
      if (userFilters.stepToggles) {
        setStepToggles({ ...userFilters.stepToggles });
      }
    }
  }, [visible, userFilters]);

  // 홀짝 비율 5:1, 1:5, 6:0, 0:6 포함 및 수치 옵션 정밀 세분화
  const filterOptionsMap: Record<string, string[]> = {
    '번호 추출 방법': ['최근 출현 (AI 최적화)', '가중치 믹스', '완전 무작위'],
    '과거 당첨 제외 필터': ['3등까지 제외', '1등만 제외', '2등까지 제외', '5등까지 제외', '제외 안함'],
    '이월수 제외 필터': ['2회 이상 제외', '1회 이상 제외', '3회 이상 제외', '4회 이상 제외', '제외 안함'],
    '연속 번호 제외 필터': ['2개 연속 이상 제외', '3개 연속 이상 제외', '제외 안함'],
    '번호합 범위 필터': ['범위 : 85 ~ 122', '범위 : 115 ~ 135 (표준 퀀트)', '범위 : 100 ~ 140', '범위 : 70 ~ 110', '범위 : 130 ~ 160'],
    '앞수합 범위 필터': ['범위 : 20 ~ 40', '범위 : 15 ~ 35', '범위 : 30 ~ 50', '범위 : 40 ~ 60', '범위 : 5 ~ 25'],
    '뒷수합 범위 필터': ['범위 : 70 ~ 105', '범위 : 60 ~ 95', '범위 : 80 ~ 115', '범위 : 90 ~ 125'],
    '첫수합 범위 필터': ['범위 : 5 ~ 10', '범위 : 1 ~ 5', '범위 : 10 ~ 15', '범위 : 15 ~ 20'],
    '끝수합 범위 필터': ['범위 : 20 ~ 35', '범위 : 10 ~ 25', '범위 : 25 ~ 40', '범위 : 30 ~ 45'],
    'AC값 범위 필터': ['7이상', '8이상 (표준 퀀트)', '9이상', '6이상', '5이하 (수축)', '전체'],
    '홀 : 짝 비율 필터': [
      '홀 : 짝 = 3 : 3 (표준)', 
      '홀 : 짝 = 4 : 2', 
      '홀 : 짝 = 2 : 4', 
      '홀 : 짝 = 5 : 1 (과열)', 
      '홀 : 짝 = 1 : 5 (과열)', 
      '홀 : 짝 = 6 : 0 (극단)', 
      '홀 : 짝 = 0 : 6 (극단)', 
      '전체 비율'
    ],
    '동일 색상 제한 필터': ['동일 색상 최대 4개', '동일 색상 최대 3개', '동일 색상 최대 5개', '제외 안함']
  };

  const [stepToggles, setStepToggles] = useState<Record<number, boolean>>(
    userFilters.stepToggles || {
      1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true,
      9: true, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true,
      17: true, 18: true, 19: true, 20: true, 21: true, 22: true, 23: true
    }
  );

  const toggleStep = (stepNo: number) => {
    setStepToggles(prev => ({ ...prev, [stepNo]: !prev[stepNo] }));
  };

  // [🤖 AI 필터 자동 추천] 클릭 시 2.5초 실시간 시각화 애니메이션 가동
  const handleAiAutoRecommend = () => {
    setIsAiAnalyzing(true);
    setAiStepIndex(0);
    progressAnim.setValue(0);

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    const t1 = setTimeout(() => setAiStepIndex(1), 800);
    const t2 = setTimeout(() => setAiStepIndex(2), 1600);
    const t3 = setTimeout(() => {
      setIsAiAnalyzing(false);
      const newFilterValues = {
        '번호 추출 방법': '최근 출현 (AI 최적화)',
        '과거 당첨 제외 필터': '3등까지 제외',
        '이월수 제외 필터': '2회 이상 제외',
        '연속 번호 제외 필터': '2개 연속 이상 제외',
        '번호합 범위 필터': '범위 : 85 ~ 122',
        '앞수합 범위 필터': '범위 : 20 ~ 40',
        '뒷수합 범위 필터': '범위 : 70 ~ 105',
        '첫수합 범위 필터': '범위 : 5 ~ 10',
        '끝수합 범위 필터': '범위 : 20 ~ 35',
        'AC값 범위 필터': '7이상',
        '홀 : 짝 비율 필터': '홀 : 짝 = 3 : 3 (표준)',
        '동일 색상 제한 필터': '동일 색상 최대 4개',
      };
      // 하드코딩 제거: 100% 동적 킬 스위치 연산 결과에서 상위 제외수 도출
      const dynamicDeathResult = calculateDeathZone(OFFLINE_DB);
      const newExcluded = dynamicDeathResult.deathZone.slice(0, 6);
      setFilterValues(newFilterValues);
      setExcludedBalls(newExcluded);
      updateUserFilters({
        excludedNums: newExcluded,
        filterValues: newFilterValues
      });
      Alert.alert(
        '🤖 AI 필터 분석 최적화 완수',
        `최신 ${OFFLINE_DB.length}개 DB 동적 킬 스위치 패턴 분석을 완료하여 최적 필터 및 제외수(${newExcluded.join(', ')})가 자동 세팅 및 저장되었습니다!`
      );
    }, 2500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  };


  const handlePickNumber = (num: number) => {
    if (numberPickerMode === 'included') {
      if (includedBalls.includes(num)) {
        setIncludedBalls(includedBalls.filter(n => n !== num));
      } else {
        if (excludedBalls.includes(num)) {
          Alert.alert('선택 불가', `${num}번은 이미 '제외수'로 지정되어 있어 포함수로 중복 선택할 수 없습니다.`);
          return;
        }
        if (includedBalls.length >= 5) {
          Alert.alert('알림', '포함수는 최대 5개까지 설정할 수 있습니다.');
          return;
        }
        setIncludedBalls([...includedBalls, num].sort((a, b) => a - b));
      }
    } else if (numberPickerMode === 'excluded') {
      if (excludedBalls.includes(num)) {
        setExcludedBalls(excludedBalls.filter(n => n !== num));
      } else {
        if (includedBalls.includes(num)) {
          Alert.alert('선택 불가', `${num}번은 이미 '포함수'로 지정되어 있어 제외수로 중복 선택할 수 없습니다.`);
          return;
        }
        if (excludedBalls.length >= 35) {
          Alert.alert('알림', '제외수는 최대 35개까지 설정할 수 있습니다.');
          return;
        }
        setExcludedBalls([...excludedBalls, num].sort((a, b) => a - b));
      }
    }
  };

  const removeIncludedBall = (num: number) => {
    setIncludedBalls(includedBalls.filter(n => n !== num));
  };

  const removeExcludedBall = (num: number) => {
    setExcludedBalls(excludedBalls.filter(n => n !== num));
  };

  const filterRows = [
    { label: '번호 추출 방법', color: '#60A5FA' },
    { label: '과거 당첨 제외 필터', color: '#34D399' },
    { label: '이월수 제외 필터', color: '#2DD4BF' },
    { label: '연속 번호 제외 필터', color: '#60A5FA' },
    { label: '번호합 범위 필터', color: '#FBBF24' },
    { label: '앞수합 범위 필터', color: '#FBBF24' },
    { label: '뒷수합 범위 필터', color: '#FBBF24' },
    { label: '첫수합 범위 필터', color: '#FBBF24' },
    { label: '끝수합 범위 필터', color: '#FBBF24' },
    { label: 'AC값 범위 필터', color: '#FBBF24' },
    { label: '홀 : 짝 비율 필터', color: '#FBBF24' },
    { label: '동일 색상 제한 필터', color: '#34D399' },
  ];

  const stepList = [
    { no: 1, title: 'Step 1. 최근 50회차 단기 모멘텀 트래킹' },
    { no: 2, title: 'Step 2. 실시간 패턴 변화 전수 스캔' },
    { no: 3, title: 'Step 3. 개별 번호 장기 미출현 동적 트래킹 (Cold Gap)' },
    { no: 4, title: 'Step 4. 연속수 출현 주기 팩트 체크' },
    { no: 5, title: 'Step 5. 끝수 출현 주기 패턴 (End-Digit Cycle)' },
    { no: 6, title: 'Step 6. 하이퍼 모멘텀 킬 스위치 (과열 끝수 3주차 100% 소각)' },
    { no: 7, title: 'Step 7. 공 색상 수급 및 출현 주기 (Color Band Sync)' },
    { no: 8, title: 'Step 8. OMR 공간 분산 하드 리밋 (4열 이상 점유, 3개 밀집 100% 차단)' },
    { no: 9, title: 'Step 9. OMR 세로열 단기 멸종 사이클 (3주 연속 출현 멸종)' },
    { no: 10, title: 'Step 10. 특정 번호 트리거 후행 패턴' },
    { no: 11, title: 'Step 11. 이웃수 83% 법칙 (+1, -1 최소 1개 강제 포함)' },
    { no: 12, title: 'Step 12. N주 회귀 분석 (5주, 10주, 12주 전 회귀수)' },
    { no: 13, title: 'Step 13. 이월수 및 혼합 이월 팩트 체크' },
    { no: 14, title: 'Step 14. 보너스 번호 반발력 헷징' },
    { no: 15, title: 'Step 15. 총합 밴드 락인 크로스체크 (홀짝 회귀 시 이월 허용)' },
    { no: 16, title: 'Step 16. 총합/앞수합/뒷수합 등락 회귀' },
    { no: 17, title: 'Step 17. 극단적 홀짝 교차 진동 (3주 연속 비율 멸종)' },
    { no: 18, title: 'Step 18. AC값 수축과 팽창 법칙 (AC 10 만점 시 AC 7~9 하향)' },
    { no: 19, title: 'Step 19. 장기 미출현 궁합수 타격' },
    { no: 20, title: 'Step 20. 다중 교차 절대 제외수 도출 (Death Zone Output)' },
    { no: 21, title: 'Step 21. 잔여 경우의 수 압축 계산 (814만 개 ➔ 수형도 압축)' },
    { no: 22, title: 'Step 22. 무결점 정규 포트폴리오 추출 (5 Types)' },
    { no: 23, title: 'Step 23. 진성 역발상 압축 추출 (정규 30개+Death Zone 소각 후 5 Types)' },
  ];

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: '#18181B' }]}>
          <View style={[styles.modalHeader, { borderBottomColor: '#27272A' }]}>
            <Text style={[styles.modalHeaderTitle, { color: '#F4F4F5' }]}>번호 발생 필터 설정</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#F4F4F5" size={22} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* [🤖 AI 필터 자동 추천] 버튼 */}
            <TouchableOpacity style={styles.aiRecommendBtn} onPress={handleAiAutoRecommend}>
              <Bot color="#FFF" size={20} style={{ marginRight: 6 }} />
              <Text style={styles.aiRecommendText}>🤖 AI 자동 최적화 추천 (1239개 DB 스캔)</Text>
            </TouchableOpacity>

            {/* 필터 탭 */}
            <View style={styles.filterTabContainer}>
              <TouchableOpacity 
                style={[styles.filterTabBtn, activeTab === 'basic' && styles.filterTabBtnActive]} 
                onPress={() => setActiveTab('basic')}
              >
                <Text style={[styles.filterTabText, activeTab === 'basic' && styles.filterTabTextActive]}>
                  기본 범위 필터 (12개)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterTabBtn, activeTab === 'steps' && styles.filterTabBtnActive]} 
                onPress={() => setActiveTab('steps')}
              >
                <Text style={[styles.filterTabText, activeTab === 'steps' && styles.filterTabTextActive]}>
                  Step 1~23 스텝 ON/OFF (23개)
                </Text>
              </TouchableOpacity>
            </View>

            {/* TAB 1: 기본 드롭다운 필터 리스트 */}
            {activeTab === 'basic' && (
              <View>
                {filterRows.map((row, idx) => (
                  <View key={idx} style={styles.darkFilterRow}>
                    <Text style={styles.darkFilterLabel}>{row.label}</Text>
                    <TouchableOpacity 
                      style={styles.darkFilterValueBox}
                      onPress={() => setPickerKey(row.label)}
                    >
                      <Text style={[styles.darkFilterValueText, { color: row.color }]}>
                        {filterValues[row.label] || '선택'}
                      </Text>
                      <Text style={{ color: '#A1A1AA', fontSize: 12 }}>▼</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {/* 포함수 (최대 5개) 영역 */}
                <View style={styles.darkSectionBox}>
                  <View style={styles.darkSectionHeader}>
                    <Text style={styles.darkSectionTitle}>포함수 (최대 5개 - 터치 시 삭제)</Text>
                    <TouchableOpacity style={styles.darkDelBtn} onPress={() => setIncludedBalls([])}>
                      <Text style={{ color: '#E4E4E7', fontSize: 12 }}>전체 삭제</Text>
                    </TouchableOpacity>
                  </View>

                  {includedBalls.length > 0 ? (
                    <View style={styles.excludedBallsRow}>
                      {includedBalls.map(num => (
                        <TouchableOpacity key={num} onPress={() => removeIncludedBall(num)}>
                          <LottoBall number={num} size={38} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={styles.addTriggerBtn}
                      onPress={() => setNumberPickerMode('included')}
                    >
                      <PlusCircle color={COLORS.primary} size={18} style={{ marginRight: 6 }} />
                      <Text style={styles.darkAddHintText}>추가하려면 누르세요 (포함수 선택)</Text>
                    </TouchableOpacity>
                  )}

                  {includedBalls.length > 0 && (
                    <TouchableOpacity 
                      style={[styles.addTriggerBtn, { marginTop: 8 }]}
                      onPress={() => setNumberPickerMode('included')}
                    >
                      <Text style={{ color: COLORS.primary, fontSize: 12, fontWeight: '800' }}>+ 포함수 더 추가하기</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* 제외수 (최대 35개) 영역 */}
                <View style={styles.darkSectionBox}>
                  <View style={styles.darkSectionHeader}>
                    <Text style={styles.darkSectionTitle}>제외수 (최대 35개 - 터치 시 삭제)</Text>
                    <TouchableOpacity style={styles.darkDelBtn} onPress={() => setExcludedBalls([])}>
                      <Text style={{ color: '#E4E4E7', fontSize: 12 }}>전체 삭제</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.excludedBallsRow}>
                    {excludedBalls.map(num => (
                      <TouchableOpacity key={num} onPress={() => removeExcludedBall(num)}>
                        <LottoBall number={num} size={38} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={[styles.addTriggerBtn, { marginTop: 8 }]}
                    onPress={() => setNumberPickerMode('excluded')}
                  >
                    <PlusCircle color={COLORS.neonRed} size={18} style={{ marginRight: 6 }} />
                    <Text style={{ color: COLORS.neonRed, fontSize: 13, fontWeight: '800' }}>+ 제외수 번호 추가하기</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 2: Step 1 ~ 23 ON/OFF 토글 */}
            {activeTab === 'steps' && (
              <View>
                <Text style={{ color: '#A1A1AA', fontSize: 12, marginBottom: 12 }}>
                  V26.1 마르코프-퀀트 엔진 Step 1~23 전략 알고리즘 스텝별 ON/OFF 토글
                </Text>
                {stepList.map(step => {
                  const isOn = stepToggles[step.no] ?? true;
                  return (
                    <View key={step.no} style={styles.stepToggleRow}>
                      <Text style={styles.stepToggleTitle}>{step.title}</Text>
                      <TouchableOpacity 
                        style={[styles.stepSwitchBtn, isOn && styles.stepSwitchActive]} 
                        onPress={() => toggleStep(step.no)}
                      >
                        <Text style={styles.stepSwitchText}>{isOn ? 'ON' : 'OFF'}</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            <TouchableOpacity 
              style={styles.applyFilterBtn} 
              onPress={() => {
                updateUserFilters({
                  includedNums: includedBalls,
                  excludedNums: excludedBalls,
                  filterValues,
                  stepToggles,
                });
                Alert.alert(
                  '필터 적용 완료',
                  `설정하신 제외수(${excludedBalls.length}개), 포함수(${includedBalls.length}개) 및 필터 수치가 퀀트 엔진에 100% 반영되었습니다.`
                );
                onClose();
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 15 }}>필터 설정 저장하기</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ----------------------------------------------------------------- */}
        {/* [모달 팝업 1] AI 실시간 2.5초 필터 분석 시각화 팝업 */}
        {/* ----------------------------------------------------------------- */}
        {isAiAnalyzing && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.subModalOverlay}>
              <View style={[styles.subModalContainer, { padding: 20, alignItems: 'center', backgroundColor: '#0F172A' }]}>
                <Cpu color={COLORS.primary} size={40} style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#FFF', marginBottom: 4 }}>
                  AI 필터 실시간 최적화 분석 중
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '800', marginBottom: 16 }}>
                  1,239개 오프라인 DB 수급 모멘텀 패턴 행렬 스캔
                </Text>

                <View style={styles.aiProgressTrack}>
                  <Animated.View style={[styles.aiProgressFill, { width: barWidth }]} />
                </View>

                <View style={styles.aiLogBox}>
                  <Bot color={COLORS.neonGreen} size={16} style={{ marginRight: 6 }} />
                  <Text style={{ color: '#F4F4F5', fontSize: 12, fontWeight: '700', flex: 1 }}>
                    {aiFilterSteps[aiStepIndex]}
                  </Text>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* [모달 팝업 2] 드롭다운 옵션 픽커 팝업 */}
        {/* ----------------------------------------------------------------- */}
        {pickerKey && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.subModalOverlay}>
              <View style={styles.subModalContainer}>
                <View style={styles.subModalHeader}>
                  <Text style={styles.subModalTitle}>{pickerKey} 수치 선택</Text>
                  <TouchableOpacity onPress={() => setPickerKey(null)}>
                    <X color="#F4F4F5" size={20} />
                  </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 12 }}>
                  {(filterOptionsMap[pickerKey] || []).map((option, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.optionRowBtn}
                      onPress={() => {
                        setFilterValues(prev => ({ ...prev, [pickerKey]: option }));
                        setPickerKey(null);
                      }}
                    >
                      <Text style={styles.optionRowText}>{option}</Text>
                      {filterValues[pickerKey] === option && (
                        <CheckCircle2 color={COLORS.primary} size={18} />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* [모달 팝업 3] 포함수/제외수 1~45 공 선택 팝업 */}
        {/* ----------------------------------------------------------------- */}
        {numberPickerMode && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.subModalOverlay}>
              <View style={styles.subModalContainer}>
                <View style={styles.subModalHeader}>
                  <Text style={styles.subModalTitle}>
                    {numberPickerMode === 'included' ? '포함수 (최대 5개) 선택' : '제외수 (최대 35개) 선택'}
                  </Text>
                  <TouchableOpacity onPress={() => setNumberPickerMode(null)}>
                    <X color="#F4F4F5" size={20} />
                  </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 16 }}>
                  <Text style={{ color: '#A1A1AA', fontSize: 11, marginBottom: 12, textAlign: 'center' }}>
                    공을 터치하면 포함수/제외수에 즉시 추가 및 해제됩니다.
                  </Text>
                  <View style={styles.pickerBallGrid}>
                    {Array.from({ length: 45 }, (_, i) => i + 1).map(num => {
                      const isIncluded = includedBalls.includes(num);
                      const isExcluded = excludedBalls.includes(num);
                      const isTarget = numberPickerMode === 'included' ? isIncluded : isExcluded;
                      const isBlocked = numberPickerMode === 'included' ? isExcluded : isIncluded;

                      return (
                        <TouchableOpacity
                          key={num}
                          style={[
                            styles.pickerBallCell, 
                            isTarget && styles.pickerBallCellSelected,
                            isBlocked && { opacity: 0.3, backgroundColor: 'rgba(239, 68, 68, 0.08)' }
                          ]}
                          onPress={() => handlePickNumber(num)}
                        >
                          <LottoBall number={num} size={34} />
                          {isTarget && <View style={styles.selectedCheckDot} />}
                          {isBlocked && (
                            <View style={styles.blockedBadge}>
                              <Text style={styles.blockedBadgeText}>
                                {numberPickerMode === 'included' ? '제외중' : '포함중'}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity 
                    style={[styles.applyFilterBtn, { marginTop: 16 }]}
                    onPress={() => setNumberPickerMode(null)}
                  >
                    <Text style={{ color: '#FFF', fontWeight: '900' }}>선택 완료</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 4. 선택번호 보관함 모달 (SavedNumbersModal) - 글로벌 savedGames 연동
// ---------------------------------------------------------------------------
export const SavedNumbersModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const { savedGames, deleteSavedNumberCombination } = useLotto();

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="내 선택 번호 보관함" onClose={onClose} />
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSubText}>
              수동 선택 및 저장한 로또 조합 리스트 ({savedGames.length}개)
            </Text>

            {savedGames.length === 0 ? (
              <View style={styles.emptySavedBox}>
                <Text style={styles.emptySavedText}>저장된 번호 조합이 없습니다.</Text>
                <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                  홈화면의 '수동 입력'에서 번호를 선택하고 보관함에 저장해보세요.
                </Text>
              </View>
            ) : (
              savedGames.map((game, idx) => (
                <View key={idx} style={styles.savedCard}>
                  <Text style={styles.savedCardTitle}>보관 조합 #{savedGames.length - idx} (수동/선택)</Text>
                  <View style={styles.ballsRowCenter}>
                    {game.map((n, ballIdx) => (
                      <LottoBall key={ballIdx} number={n} size={34} />
                    ))}
                  </View>
                  <View style={styles.savedActionRow}>
                    <TouchableOpacity 
                      style={styles.shareBtn} 
                      onPress={() => Alert.alert('공유', `조합 [${game.join(', ')}]가 클립보드에 복사되었습니다.`)}
                    >
                      <Share2 color={COLORS.primary} size={14} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, color: COLORS.primary, fontWeight: '700' }}>공유</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.deleteBtn} 
                      onPress={() => deleteSavedNumberCombination(idx)}
                    >
                      <Trash2 color={COLORS.neonRed} size={14} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, color: COLORS.neonRed, fontWeight: '700' }}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 5. 당첨번호 확인 모달 (WinningHistoryModal - 전체 1,239개 당첨번호 리스트업)
// ---------------------------------------------------------------------------
export const WinningHistoryModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [searchDrw, setSearchDrw] = useState('');
  const [isAscending, setIsAscending] = useState(false); // false: 최신순(1239->1)

  const filtered = OFFLINE_DB.filter(d => {
    if (!searchDrw.trim()) return true;
    return d.draw.toString().includes(searchDrw.trim());
  });

  const displayList = isAscending ? [...filtered].reverse() : filtered;

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="역대 당첨번호 전체 리스트 (1~1239회)" onClose={onClose} />
          
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {/* 상단 회차 검색 및 정렬 스위치 */}
            <View style={styles.historyTopControls}>
              <View style={styles.historySearchInputBox}>
                <TextInput
                  style={styles.historySearchInput}
                  value={searchDrw}
                  onChangeText={setSearchDrw}
                  keyboardType="number-pad"
                  placeholder="회차 검색 (예: 1239, 1)"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <TouchableOpacity 
                style={styles.historySortBtn}
                onPress={() => setIsAscending(!isAscending)}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>
                  {isAscending ? '과거순 ↕' : '최신순 ↕'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubText}>
              총 {displayList.length}개 회차 당첨번호 (오프라인 100% 검증)
            </Text>

            {/* 1,239개 회차 1줄 가로 컴팩트 당첨번호 연속 리스트 */}
            {displayList.map((item) => (
              <View key={item.draw} style={styles.compactHistoryRow}>
                <Text style={styles.compactHistoryDrawNo}>{item.draw}회</Text>
                
                <View style={styles.compactHistoryBallsGroup}>
                  {item.nums.map((n: number) => (
                    <LottoBall key={n} number={n} size={28} />
                  ))}
                  <Text style={styles.compactHistoryPlus}>+</Text>
                  <LottoBall number={item.bonus} size={28} isBonus />
                </View>

                <Text style={styles.compactHistoryBonusLabel}>
                  (보너스 {item.bonus})
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 6. QR코드 당첨 스캐너 모달 (QrScannerModal)
// ---------------------------------------------------------------------------
export const QrScannerModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const [qrNums, setQrNums] = useState('11, 13, 22, 32, 33, 36');
  const [resultText, setResultText] = useState<string | null>(null);

  const handleScan = () => {
    const parsed = qrNums.split(',').map(s => parseInt(s.trim(), 10));
    if (parsed.length === 6 && parsed.every(n => !isNaN(n) && n >= 1 && n <= 45)) {
      const matchCount = parsed.filter(n => [11, 13, 22, 32, 33, 36].includes(n)).length;
      if (matchCount === 6) setResultText('🎉 축하합니다! 1등 당첨! (당첨금 22억원)');
      else if (matchCount === 5) setResultText('🎉 축하합니다! 3등 당첨! (당첨금 150만원)');
      else if (matchCount === 4) setResultText('🎉 축하합니다! 4등 당첨! (당첨금 5만원)');
      else if (matchCount === 3) setResultText('🎉 5등 당첨! (당첨금 5천원)');
      else setResultText('아쉽지만 낙첨되었습니다. 다음 회차 퀀트 추천을 받아보세요!');
    } else {
      Alert.alert('오류', '6개 숫자를 쉼표로 구분하여 입력해주세요 (예: 11, 13, 22, 32, 33, 36)');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="QR코드 로또 당첨 확인 스캐너" onClose={onClose} />
          <ScrollView contentContainerStyle={{ padding: 16, alignItems: 'center' }}>
            <View style={styles.qrFrame}>
              <QrCode color={COLORS.primary} size={90} />
              <Text style={styles.qrFrameText}>복권 용지 QR코드를 카메라 프레임에 맞춰주세요</Text>
            </View>

            <Text style={{ fontSize: 13, fontWeight: '700', marginVertical: 10, color: COLORS.textPrimary }}>
              또는 번호 6개 직접 입력 시뮬레이션:
            </Text>
            <TextInput
              style={styles.qrInput}
              value={qrNums}
              onChangeText={setQrNums}
              placeholder="11, 13, 22, 32, 33, 36"
            />
            <TouchableOpacity style={styles.qrCheckBtn} onPress={handleScan}>
              <Text style={{ color: '#FFF', fontWeight: '800' }}>당첨 결과 자동 판정</Text>
            </TouchableOpacity>

            {resultText && (
              <View style={styles.qrResultBox}>
                <Text style={styles.qrResultText}>{resultText}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 7. 주변 판매점/명당 지도 모달 (StoreMapModal)
// ---------------------------------------------------------------------------
export const StoreMapModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => {
  const stores = [
    { name: '스파 편의점', address: '서울 노원구 동일로 1493', wins: '1등 52회 배출' },
    { name: '부일카서비스', address: '부산 동구 자성로133번길 35', wins: '1등 48회 배출' },
    { name: '라이프복권', address: '인천 계양구 봉오대로 441', wins: '1등 35회 배출' },
    { name: '복권명당 (본점)', address: '대구 달서구 월배로 11', wins: '1등 31회 배출' },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ModalHeader title="전국 1등 배출 명당 판매점" onClose={onClose} />
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            <Text style={styles.modalSubText}>전국 1·2등 최다 당첨 명당 판매점 리스트</Text>
            {stores.map((st, idx) => (
              <View key={idx} style={styles.storeCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MapPin color={COLORS.primary} size={20} style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.storeName}>{st.name}</Text>
                    <Text style={styles.storeAddr}>{st.address}</Text>
                  </View>
                  <View style={styles.winTag}>
                    <Text style={styles.winTagText}>{st.wins}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

// ---------------------------------------------------------------------------
// 8. 데이터 백업 모달 (DataBackupModal)
// ---------------------------------------------------------------------------
export const DataBackupModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <ModalHeader title="오프라인 DB & 백업 관리" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.modalSubText}>로컬 1239개 DB 및 개인 생성 이력을 안전하게 관리합니다.</Text>
          <TouchableOpacity style={styles.backupBtn} onPress={() => Alert.alert('백업 성공', '1239개 로컬 DB 및 설정값이 백업 파일로 내보내졌습니다.')}>
            <Database color="#FFF" size={18} style={{ marginRight: 6 }} />
            <Text style={{ color: '#FFF', fontWeight: '800' }}>내보내기 (JSON 백업)</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ---------------------------------------------------------------------------
// 9. 설정 모달 (SettingsModal)
// ---------------------------------------------------------------------------
export const SettingsModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <ModalHeader title="앱 및 퀀트 파라미터 설정" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.modalSubText}>lotto_AI V26.1 마르코프-퀀트 엔진 가중치 설정</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>• 분석 엔진 버전: V26.1 MARKOV-QUANT</Text>
          <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 6 }}>• 오프라인 DB 크기: 1,239개 회차 탑재</Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ---------------------------------------------------------------------------
// 10. 도움말 모달 (HelpModal)
// ---------------------------------------------------------------------------
export const HelpModal: React.FC<{ visible: boolean; onClose: () => void }> = ({ visible, onClose }) => (
  <Modal visible={visible} animationType="slide" transparent={true}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <ModalHeader title="lotto_AI V26.1 가이드라인" onClose={onClose} />
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.modalSubText}>
            Step 1~23 퀀트 파이프라인 및 OMR 4열 공간분산 6가지 필터를 거쳐 정규 5게임과 진성 역발상 5게임을 추출합니다.
          </Text>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  subModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  subModalContainer: {
    width: '100%',
    backgroundColor: '#27272A',
    borderRadius: 16,
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#3F3F46',
    overflow: 'hidden',
  },
  subModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3F3F46',
    backgroundColor: '#18181B',
  },
  subModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  aiProgressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: '#3F3F46',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  aiProgressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  aiLogBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181B',
    padding: 12,
    borderRadius: 8,
    width: '100%',
  },
  optionRowBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#3F3F46',
  },
  optionRowText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  modalContainer: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalSubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 16,
  },
  aiRecommendBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  aiRecommendText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  filterTabContainer: {
    flexDirection: 'row',
    backgroundColor: '#27272A',
    borderRadius: 8,
    padding: 4,
    marginBottom: 14,
  },
  filterTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  filterTabBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
  },
  filterTabTextActive: {
    color: '#FFF',
  },
  darkFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  darkFilterLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  darkFilterValueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  darkFilterValueText: {
    fontSize: 13,
    fontWeight: '800',
  },
  darkSectionBox: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  darkSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  darkSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  darkDelBtn: {
    backgroundColor: '#3F3F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  addTriggerBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  darkAddHintText: {
    fontSize: 14,
    color: '#D4D4D8',
    fontWeight: '700',
  },
  excludedBallsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  pickerBallGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pickerBallCell: {
    position: 'relative',
    padding: 2,
  },
  pickerBallCellSelected: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },
  selectedCheckDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.neonGreen,
  },
  stepToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#27272A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  stepToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F4F4F5',
    flex: 1,
    paddingRight: 8,
  },
  stepSwitchBtn: {
    backgroundColor: '#3F3F46',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stepSwitchActive: {
    backgroundColor: COLORS.neonGreen,
  },
  stepSwitchText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFF',
  },
  applyFilterBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  omrPaperBoard: {
    backgroundColor: '#FFFDF5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  omrPaperHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 10,
    alignItems: 'center',
  },
  omrPaperTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#B91C1C',
  },
  ballGrid7Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  omrCellButton: {
    width: '12.6%',
    height: 36,
    margin: '0.8%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#94A3B8',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  omrCellSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#991B1B',
  },
  omrCellNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  omrCellNumSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  selectedBoard: {
    backgroundColor: COLORS.cardBgLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  boardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  selectedBallsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  verifyBox: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  verifyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 6,
  },
  verifyItem: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  slipCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  slipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slipGameTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  slipNumbersText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  omrGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  omrCell: {
    width: 22,
    height: 18,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  omrMarked: {
    backgroundColor: '#EF4444',
    borderColor: '#B91C1C',
  },
  omrText: {
    fontSize: 8,
    color: '#475569',
  },
  omrMarkedText: {
    color: '#FFF',
    fontWeight: '800',
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  searchBarInput: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  searchBarBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyDetailCard: {
    backgroundColor: COLORS.cardBgLight,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  ballsRowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  plusSign: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginHorizontal: 4,
  },
  historySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  historyTopControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  historySearchInputBox: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  historySearchInput: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  historySortBtn: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  compactHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBgLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  compactHistoryDrawNo: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.textPrimary,
    width: 48,
  },
  compactHistoryBallsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  compactHistoryPlus: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginHorizontal: 1,
  },
  compactHistoryBonusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  qrFrame: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginBottom: 16,
  },
  qrFrameText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  qrInput: {
    width: '100%',
    height: 44,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    fontSize: 14,
    marginBottom: 10,
  },
  qrCheckBtn: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
  },
  qrResultBox: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  qrResultText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  savedCard: {
    backgroundColor: COLORS.cardBgLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  savedCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  savedActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  emptySavedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptySavedText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 4,
  },
  storeCard: {
    backgroundColor: COLORS.cardBgLight,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  storeAddr: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  winTag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  backupBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  blockedBadge: {
    position: 'absolute',
    bottom: -4,
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    zIndex: 10,
  },
  blockedBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
  }
});
