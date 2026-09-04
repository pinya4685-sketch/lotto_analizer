import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../constants/theme';
import { ADMOB_TEST_IDS } from '../services/adMobService';
import { X, Play, ShieldCheck } from 'lucide-react-native';

interface AdMobInterstitialModalProps {
  visible: boolean;
  onCloseAndNavigate: () => void;
}

export const AdMobInterstitialModal: React.FC<AdMobInterstitialModalProps> = ({
  visible,
  onCloseAndNavigate,
}) => {
  const [canClose, setCanClose] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (visible) {
      setCanClose(false);
      setCountdown(3);

      const timer1 = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer1);
            setCanClose(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer1);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View style={styles.interstitialContainer}>
        {/* 상단 닫기 X 버튼 (카운트다운 후 활성화) */}
        <View style={styles.topHeader}>
          <Text style={styles.adTag}>Google AdMob Test Interstitial Ad</Text>
          {canClose ? (
            <TouchableOpacity style={styles.closeBtn} onPress={onCloseAndNavigate}>
              <X color="#FFFFFF" size={24} style={{ marginRight: 4 }} />
              <Text style={styles.closeBtnText}>닫기 X</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.countdownBadge}>
              <Text style={styles.countdownText}>{countdown}초 후 닫기 가능</Text>
            </View>
          )}
        </View>

        {/* 전면 광고 메인 비주얼 영역 */}
        <View style={styles.adContentBox}>
          <View style={styles.adIconCircle}>
            <Play color={COLORS.primary} size={48} />
          </View>
          <Text style={styles.adTitle}>구글 애드몹 전면 광고 (Interstitial)</Text>
          <Text style={styles.adSubtitle}>ID: {ADMOB_TEST_IDS.INTERSTITIAL}</Text>

          <View style={styles.adCardPreview}>
            <ShieldCheck color={COLORS.neonGreen} size={28} style={{ marginBottom: 6 }} />
            <Text style={styles.adCardTitle}>lotto_AI V26.1 마르코프-퀀트 분석</Text>
            <Text style={styles.adCardDesc}>
              광고 시청이 완료되었습니다. '닫기(X)'를 누르시면 8,145,060개 수형도를 압축한 무결점 퀀트 10게임 결과를 즉시 보여드립니다.
            </Text>
          </View>
        </View>

        {/* 하단 확인 액션 버튼 */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.actionBtn, !canClose && styles.actionBtnDisabled]}
            disabled={!canClose}
            onPress={onCloseAndNavigate}
          >
            <Text style={styles.actionBtnText}>
              {canClose ? '광고 닫고 분석 결과 보기' : `광고 시청 중... (${countdown}초)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  interstitialContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 48,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adTag: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '900',
  },
  countdownBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  countdownText: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  adContentBox: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  adIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  adTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  adSubtitle: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginBottom: 24,
  },
  adCardPreview: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  adCardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  adCardDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  bottomBar: {
    marginBottom: 20,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionBtnDisabled: {
    backgroundColor: '#334155',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
