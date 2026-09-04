import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Alert 
} from 'react-native';
import { useLotto } from '../context/LottoContext';
import { LottoBall } from '../components/LottoBall';
import { COLORS } from '../constants/theme';
import { Sparkles, ShieldAlert, RotateCcw, BookmarkPlus } from 'lucide-react-native';

export const ResultScreen: React.FC = () => {
  const { 
    regularGames, 
    contrarianGames, 
    pipelineStats, 
    runQuantAnalysis,
    isEngineRunning,
    isDarkMode,
    saveNumberCombination
  } = useLotto();

  // 가변 테마 색상
  const dynamicBg = isDarkMode ? '#0F172A' : COLORS.background;
  const dynamicCard = isDarkMode ? '#1E293B' : COLORS.cardBg;
  const dynamicText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const dynamicBorder = isDarkMode ? '#334155' : COLORS.border;

  const handleSaveGame = (gameNumbers: number[], gameTypeStr: string) => {
    saveNumberCombination(gameNumbers);
    Alert.alert(
      '📌 보관함 저장 완료',
      `${gameTypeStr} 조합 [${gameNumbers.join(', ')}]가 '선택번호 확인' 보관함에 100% 저장되었습니다!`
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: dynamicBg }]} contentContainerStyle={styles.contentContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerTitle, { color: dynamicText }]}>발생번호 추출 결과</Text>
          <Text style={styles.headerSubtitle}>
            마르코프-퀀트 V26.1 정규 무결점 5게임 + 진성 역발상 5게임
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.reGenerateBtn} 
          onPress={runQuantAnalysis}
          disabled={isEngineRunning}
        >
          <RotateCcw color="#FFF" size={16} style={{ marginRight: 4 }} />
          <Text style={styles.reGenerateBtnText}>재추출</Text>
        </TouchableOpacity>
      </View>

      {/* 퀀트 필터 통계 카드 */}
      {pipelineStats && (
        <View style={styles.pipelineCard}>
          <Text style={styles.pipelineTitle}>V26.1 마르코프-퀀트 수형도 압축 통계</Text>
          <View style={styles.pipelineRow}>
            <View style={styles.pipeBox}>
              <Text style={styles.pipeLabel}>전체 경우의 수</Text>
              <Text style={styles.pipeVal}>8,145,060</Text>
            </View>
            <Text style={styles.arrowText}>➔</Text>
            <View style={styles.pipeBox}>
              <Text style={styles.pipeLabel}>사각지대 생존</Text>
              <Text style={[styles.pipeVal, { color: COLORS.neonGreen }]}>
                {pipelineStats.afterQuantFiltersCount.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.arrowText}>➔</Text>
            <View style={styles.pipeBox}>
              <Text style={styles.pipeLabel}>압축 비율</Text>
              <Text style={[styles.pipeVal, { color: COLORS.neonYellow }]}>
                {pipelineStats.compressionRatio} : 1
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* SECTION 1: 무결점 퀀트 정규 포트폴리오 5게임 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Sparkles color={COLORS.primary} size={20} style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: dynamicText }]}>
            무결점 퀀트 정규 포트폴리오 (5게임)
          </Text>
        </View>

        {regularGames.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
            <Text style={styles.emptyText}>'번호 발생' 버튼을 눌러 퀀트 번호를 추출해주세요.</Text>
          </View>
        ) : (
          regularGames.map((game, idx) => (
            <View key={game.id} style={[styles.gameCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
              <View style={styles.gameHeader}>
                <View style={styles.gameBadge}>
                  <Text style={styles.gameBadgeText}>GAME {String.fromCharCode(65 + idx)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={styles.scoreText}>퀀트 적합도 {game.score}점</Text>
                  
                  {/* [📌 보관함 저장] 버튼 */}
                  <TouchableOpacity 
                    style={styles.saveBookmarkBtn}
                    onPress={() => handleSaveGame(game.numbers, `GAME ${String.fromCharCode(65 + idx)}`)}
                  >
                    <BookmarkPlus color={COLORS.primary} size={14} style={{ marginRight: 3 }} />
                    <Text style={styles.saveBookmarkText}>보관함 저장</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.ballsRow}>
                {game.numbers.map((n) => (
                  <LottoBall key={n} number={n} size={36} />
                ))}
              </View>

              <View style={styles.tagContainer}>
                {game.tags.map((t, tIdx) => (
                  <View key={tIdx} style={styles.tagBadge}>
                    <Text style={styles.tagText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </View>

      {/* SECTION 2: 진성 역발상 반대매매 포트폴리오 5게임 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <ShieldAlert color={COLORS.neonGreen} size={20} style={{ marginRight: 6 }} />
          <Text style={[styles.sectionTitle, { color: dynamicText }]}>
            진성 역발상 알파 포트폴리오 (5게임)
          </Text>
        </View>

        {contrarianGames.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: dynamicCard, borderColor: dynamicBorder }]}>
            <Text style={styles.emptyText}>'번호 발생' 버튼을 눌러 퀀트 번호를 추출해주세요.</Text>
          </View>
        ) : (
          contrarianGames.map((game, idx) => (
            <View key={game.id} style={[styles.gameCard, styles.contrarianCard, { backgroundColor: dynamicCard }]}>
              <View style={styles.gameHeader}>
                <View style={[styles.gameBadge, { backgroundColor: COLORS.neonGreen }]}>
                  <Text style={styles.gameBadgeText}>역발상 {String.fromCharCode(65 + idx)}</Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={[styles.scoreText, { color: COLORS.neonGreen }]}>사각지대 알파 {game.score}점</Text>
                  
                  {/* [📌 보관함 저장] 버튼 */}
                  <TouchableOpacity 
                    style={[styles.saveBookmarkBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: COLORS.neonGreen }]}
                    onPress={() => handleSaveGame(game.numbers, `진성 역발상 ${String.fromCharCode(65 + idx)}`)}
                  >
                    <BookmarkPlus color={COLORS.neonGreen} size={14} style={{ marginRight: 3 }} />
                    <Text style={[styles.saveBookmarkText, { color: COLORS.neonGreen }]}>보관함 저장</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.ballsRow}>
                {game.numbers.map((n) => (
                  <LottoBall key={n} number={n} size={36} />
                ))}
              </View>

              <View style={styles.tagContainer}>
                {game.tags.map((t, tIdx) => (
                  <View key={tIdx} style={[styles.tagBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                    <Text style={[styles.tagText, { color: COLORS.neonGreen }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  reGenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  reGenerateBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  pipelineCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  pipelineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  pipelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  pipeBox: {
    alignItems: 'center',
  },
  pipeLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  pipeVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  arrowText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  gameCard: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
  },
  contrarianCard: {
    borderColor: COLORS.neonGreen,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  gameBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gameBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  saveBookmarkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  saveBookmarkText: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
  },
  ballsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  }
});
