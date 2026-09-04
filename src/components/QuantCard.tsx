import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QuantGame } from '../types/lotto';
import { LottoBall } from './LottoBall';
import { COLORS } from '../constants/theme';

interface QuantCardProps {
  game: QuantGame;
  gameIndex: number;
}

export const QuantCard: React.FC<QuantCardProps> = ({ game, gameIndex }) => {
  const isRegular = game.type === 'regular';
  const mainNeon = isRegular ? COLORS.primary : COLORS.neonGreen;

  return (
    <View
      style={[
        styles.cardContainer,
        {
          borderColor: isRegular ? COLORS.primary : 'rgba(16,185,129,0.5)',
        }
      ]}
    >
      {/* 카드 상단 헤더: 게임 라벨 & 퀀트 스코어 */}
      <View style={styles.headerRow}>
        <View style={styles.titleBadgeGroup}>
          <View style={[styles.badgeIndicator, { backgroundColor: mainNeon }]} />
          <Text style={styles.gameTitle}>GAME {gameIndex + 1}</Text>
          <View
            style={[
              styles.typeBadge,
              { 
                backgroundColor: isRegular ? COLORS.primaryLight : 'rgba(16,185,129,0.12)', 
                borderColor: mainNeon 
              }
            ]}
          >
            <Text style={[styles.typeText, { color: mainNeon }]}>
              {isRegular ? 'REGULAR QUANT' : 'CONTRARIAN ALPHA'}
            </Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>QUANT FIT</Text>
          <Text style={[styles.scoreValue, { color: mainNeon }]}>{game.score}pt</Text>
        </View>
      </View>

      {/* 번호 6개 공 출력 영역 */}
      <View style={styles.ballsRow}>
        {game.numbers.map((num) => (
          <LottoBall key={num} number={num} size={38} />
        ))}
      </View>

      {/* 태그 및 상위 확률 인덱스 Footer */}
      <View style={styles.footerRow}>
        <View style={styles.tagsContainer}>
          {game.tags.map((tag, idx) => (
            <View key={idx} style={styles.tagChip}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.probText, { color: mainNeon }]}>
          {game.probabilityIndex}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIndicator: {
    width: 6,
    height: 16,
    borderRadius: 3,
    marginRight: 8,
  },
  gameTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginRight: 8,
    fontFamily: 'System',
  },
  typeBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  scoreValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: 'System',
  },
  ballsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: COLORS.cardBgLight,
    borderRadius: 10,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  probText: {
    fontSize: 11,
    fontWeight: '700',
  }
});
