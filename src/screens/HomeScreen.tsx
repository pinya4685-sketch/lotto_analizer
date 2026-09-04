import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet 
} from 'react-native';
import { useLotto } from '../context/LottoContext';
import { LottoBall } from '../components/LottoBall';
import { AiAnalysisBridgeModal } from '../components/AiAnalysisBridgeModal';
import { AdMobInterstitialModal } from '../components/AdMobInterstitialModal';
import { 
  ManualInputModal, 
  FilterSettingModal, 
  WinningHistoryModal, 
  QrScannerModal, 
  SavedNumbersModal, 
  StoreMapModal, 
  DataBackupModal, 
  SettingsModal, 
  HelpModal 
} from '../components/FeatureModals';
import { COLORS } from '../constants/theme';
import { getOfflineDbCount } from '../services/lottoApi';
import { 
  Edit3, 
  Filter, 
  Trophy, 
  QrCode, 
  BarChart2, 
  ListChecks, 
  CheckSquare, 
  MapPin, 
  Database, 
  Settings, 
  HelpCircle,
  CheckCircle2,
  Sun,
  Moon,
  Bot,
  Sparkles
} from 'lucide-react-native';

export const HomeScreen: React.FC = ({ navigation }: any) => {
  const { 
    latestDraw, 
    runQuantAnalysis,
    isDarkMode,
    toggleTheme
  } = useLotto();

  const [showBridgeModal, setShowBridgeModal] = useState<boolean>(false);
  const [showInterstitialAd, setShowInterstitialAd] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const totalDbCount = getOfflineDbCount();

  // '번호 발생' 터치 시 즉시 결과를 보여주지 않고 전면 광고를 먼저 띄움!
  const handleGenerateNumbers = () => {
    setShowInterstitialAd(true);
  };

  // 전면 광고 시청 후 '닫기(X)'를 눌렀을 때 실행되는 콜백
  const handleAdCloseAndNavigate = () => {
    setShowInterstitialAd(false);
    // AI 분석 브릿지 연출 가동 후 결과 화면 이동
    setShowBridgeModal(true);
  };

  const handleBridgeFinish = () => {
    runQuantAnalysis();
    setShowBridgeModal(false);
    if (navigation) {
      navigation.navigate('Result');
    }
  };

  const handleGoToStats = () => {
    if (navigation) {
      navigation.navigate('Statistics');
    }
  };

  const handleGoToResult = () => {
    if (navigation) {
      navigation.navigate('Result');
    }
  };

  // 가변 테마 색상
  const dynamicBg = isDarkMode ? '#0F172A' : COLORS.background;
  const dynamicCard = isDarkMode ? '#1E293B' : COLORS.cardBg;
  const dynamicText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const dynamicBorder = isDarkMode ? '#334155' : COLORS.border;

  return (
    <ScrollView style={[styles.container, { backgroundColor: dynamicBg }]} contentContainerStyle={styles.contentContainer}>
      {/* 1. 구글 애드몹 전면 광고 (Interstitial Ad) 모달 */}
      <AdMobInterstitialModal 
        visible={showInterstitialAd}
        onCloseAndNavigate={handleAdCloseAndNavigate}
      />

      {/* 2. AI 분석 브릿지 모달 */}
      <AiAnalysisBridgeModal 
        visible={showBridgeModal}
        onFinish={handleBridgeFinish}
        drawNo={latestDraw.drwNo}
        totalDbCount={totalDbCount}
      />

      <ManualInputModal visible={activeModal === 'manual'} onClose={() => setActiveModal(null)} />
      <FilterSettingModal visible={activeModal === 'filter'} onClose={() => setActiveModal(null)} />
      <WinningHistoryModal visible={activeModal === 'history'} onClose={() => setActiveModal(null)} />
      <QrScannerModal visible={activeModal === 'qr'} onClose={() => setActiveModal(null)} />
      <SavedNumbersModal visible={activeModal === 'saved'} onClose={() => setActiveModal(null)} />
      <StoreMapModal visible={activeModal === 'store'} onClose={() => setActiveModal(null)} />
      <DataBackupModal visible={activeModal === 'backup'} onClose={() => setActiveModal(null)} />
      <SettingsModal visible={activeModal === 'settings'} onClose={() => setActiveModal(null)} />
      <HelpModal visible={activeModal === 'help'} onClose={() => setActiveModal(null)} />

      {/* 상단 타이틀 헤더 바 */}
      <View style={[styles.premiumTitleHeader, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.titleEmblemBadge}>
            <Bot color="#FFFFFF" size={24} />
          </View>

          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.appTitleDesign, { color: dynamicText }]}>로또번호 발생기</Text>
              <View style={styles.proTag}>
                <Sparkles color="#FFFFFF" size={10} style={{ marginRight: 2 }} />
                <Text style={styles.proTagText}>PRO V26.1</Text>
              </View>
            </View>
            <Text style={styles.appSubTitleDesign}>MARKOV-QUANT AI ENGINE</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.themeToggleBtn, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9', borderColor: dynamicBorder }]} onPress={toggleTheme}>
          {isDarkMode ? <Sun color="#F59E0B" size={18} /> : <Moon color={COLORS.primary} size={18} />}
          <Text style={[styles.themeToggleText, { color: dynamicText }]}>{isDarkMode ? '라이트' : '다크'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.offlineDbBadge}>
        <CheckCircle2 color={COLORS.neonGreen} size={15} style={{ marginRight: 6 }} />
        <Text style={styles.offlineDbText}>
          최신 DB 연동완료, AI 인공지능 로또 분석 시스템
        </Text>
      </View>

      {/* 홈화면 상단: 최신회차 당첨번호 하나만 표기 */}
      <View style={styles.resultBannerCard}>
        <Text style={styles.bannerHeaderTitle}>
          최신 {latestDraw.drwNo || 1239}회차 당첨결과 <Text style={styles.bannerDate}>(2026.08.29)</Text>
        </Text>

        <View style={styles.ballsRow}>
          {latestDraw.numbers.map((n, idx) => (
            <LottoBall key={idx} number={n} size={38} />
          ))}
          <Text style={styles.plusSign}>+</Text>
          <LottoBall number={latestDraw.bnusNo} size={38} isBonus />
        </View>

        <View style={styles.financialGrid}>
          <View style={styles.financialBox}>
            <Text style={styles.finLabel}>1등 총 예상 당첨금</Text>
            <Text style={styles.finValue}>11,934,545,870 원</Text>
          </View>
          <View style={styles.financialBox}>
            <Text style={styles.finLabel}>누적 판매금</Text>
            <Text style={styles.finValue}>49,622,437,000 원</Text>
          </View>
        </View>
      </View>

      {/* 정돈된 2열 메뉴 그리드 */}
      <View style={styles.menuGridSection}>
        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.gridCard, styles.mainGenerateCard]} 
            onPress={handleGenerateNumbers}
            activeOpacity={0.85}
          >
            <View style={styles.ballNumberIcon}>
              <Text style={styles.sevenNumText}>7</Text>
            </View>
            <Text style={styles.mainGenerateText}>번호 발생</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('manual')}
          >
            <Edit3 color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>수동 입력</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('filter')}
          >
            <Filter color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>필터 설정</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('history')}
          >
            <Trophy color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>당첨번호 확인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('qr')}
          >
            <QrCode color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>QR코드 입력</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridCard, styles.highlightCard]} onPress={handleGoToStats}>
            <BarChart2 color={COLORS.primary} size={28} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { fontWeight: '800', color: COLORS.primary }]}>
              통계
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]} onPress={handleGoToResult}>
            <ListChecks color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>발생번호 확인</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('saved')}
          >
            <CheckSquare color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>선택번호 확인</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('store')}
          >
            <MapPin color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>명당 판매점</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('backup')}
          >
            <Database color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>데이터 백업</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.gridRow}>
          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('settings')}
          >
            <Settings color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>설정</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.gridCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}
            onPress={() => setActiveModal('help')}
          >
            <HelpCircle color={COLORS.primary} size={26} style={styles.gridIcon} />
            <Text style={[styles.gridCardText, { color: dynamicText }]}>도움말</Text>
          </TouchableOpacity>
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
  premiumTitleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  titleEmblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  appTitleDesign: {
    fontSize: 18,
    fontWeight: '900',
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proTagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  appSubTitleDesign: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  themeToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  offlineDbBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginBottom: 16,
  },
  offlineDbText: {
    color: COLORS.neonGreen,
    fontSize: 12,
    fontWeight: '800',
  },
  resultBannerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  bannerHeaderTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textWhite,
    marginBottom: 12,
  },
  bannerDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '400',
  },
  ballsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  plusSign: {
    fontSize: 18,
    color: COLORS.textMuted,
    marginHorizontal: 4,
    fontWeight: '700',
  },
  financialGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
  },
  financialBox: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  finLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  finValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  menuGridSection: {
    gap: 10,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCard: {
    flex: 1,
    height: 76,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mainGenerateCard: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  ballNumberIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  sevenNumText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '900',
  },
  mainGenerateText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  gridIcon: {
    marginBottom: 4,
  },
  gridCardText: {
    fontSize: 13,
    fontWeight: '700',
  },
  highlightCard: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  }
});
