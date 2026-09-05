/**
 * Google AdMob 광고 관리 서비스
 * - 실제 발급받은 광고 단위 ID 및 구글 공식 테스트 광고 ID 매핑
 * - 본인인증 미완료 / 앱 미출시 상태에서는 구글 정책상 실제 ID로 광고가 나오지 않으므로(ERROR_CODE_NO_FILL),
 *   테스트 플래그(USE_TEST_ADS)를 제공하여 에뮬레이터/테스트 기기에서 정상 송출 여부를 즉시 검증할 수 있도록 지원합니다.
 */
import { Platform } from 'react-native';
import {
  TestIds,
  InterstitialAd,
  AppOpenAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

// ── 사용자님께서 실제 발급받으신 AdMob ID ──
export const ADMOB_REAL_IDS = {
  APP_ID: 'ca-app-pub-5304943972328333~1144976491',
  BANNER: 'ca-app-pub-5304943972328333/7167459365',
  INTERSTITIAL: 'ca-app-pub-5304943972328333/8847492682',
  APP_OPEN: 'ca-app-pub-5304943972328333/2306135060',
};

// ── 구글 공식 테스트 광고 단위 ID ──
export const ADMOB_TEST_IDS = {
  BANNER: TestIds.BANNER, // 'ca-app-pub-3940256099942544/6300978111'
  INTERSTITIAL: TestIds.INTERSTITIAL, // 'ca-app-pub-3940256099942544/1033173712'
  APP_OPEN: TestIds.APP_OPEN, // 'ca-app-pub-3940256099942544/9257395921'
};

/**
 * 💡 [테스트 모드 스위치]
 * - true: 구글 공식 테스트 광고 송출 (계정 인증 전, 앱 미출시, 앱플레이어 테스트 시 필수로 true 권장)
 * - false: 실제 발급받으신 사용자님 AdMob 광고 송출 (플레이스토어 심사 통과 및 계정 인증 완료 후 전환)
 */
export const USE_TEST_ADS = true;

// 각 광고 단위별 현재 사용할 ID 반환 함수
export function getBannerAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.BANNER : ADMOB_REAL_IDS.BANNER;
}

export function getInterstitialAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.INTERSTITIAL : ADMOB_REAL_IDS.INTERSTITIAL;
}

export function getAppOpenAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.APP_OPEN : ADMOB_REAL_IDS.APP_OPEN;
}

// ─────────────────────────────────────────────────────────────
// 1. 전면 광고 (Interstitial Ad) 관리자
// ─────────────────────────────────────────────────────────────
let interstitialAdInstance: InterstitialAd | null = null;
let isInterstitialLoaded = false;

/**
 * 전면 광고 사전 로드 (앱 실행 초기나 결과 확인 전에 미리 백그라운드에서 로드)
 */
export function preloadInterstitialAd() {
  if (Platform.OS === 'web') return;

  try {
    const adUnitId = getInterstitialAdUnitId();
    interstitialAdInstance = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAdInstance.addAdEventListener(AdEventType.LOADED, () => {
      isInterstitialLoaded = true;
    });

    interstitialAdInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isInterstitialLoaded = false;
      console.log('[AdMob] Interstitial load error:', error);
    });

    interstitialAdInstance.load();
  } catch (err) {
    console.log('[AdMob] Interstitial preload exception:', err);
  }
}

/**
 * 번호 생성 버튼 터치 시 전면 광고 표시
 * - 광고가 닫히거나 실패하면 onDismiss 콜백을 실행하여 결과 화면으로 부드럽게 이동
 */
export function showInterstitialAd(onDismiss: () => void) {
  if (Platform.OS === 'web') {
    onDismiss();
    return;
  }

  // 광고가 이미 로드되어 있으면 바로 표시
  if (interstitialAdInstance && isInterstitialLoaded) {
    let handled = false;
    const safeDismiss = () => {
      if (!handled) {
        handled = true;
        isInterstitialLoaded = false;
        preloadInterstitialAd(); // 다음 번을 위해 미리 다시 로드
        onDismiss();
      }
    };

    const unsubscribeClosed = interstitialAdInstance.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        unsubscribeClosed();
        safeDismiss();
      }
    );

    const unsubscribeError = interstitialAdInstance.addAdEventListener(
      AdEventType.ERROR,
      () => {
        unsubscribeError();
        safeDismiss();
      }
    );

    try {
      interstitialAdInstance.show();
    } catch (e) {
      console.log('[AdMob] Interstitial show error:', e);
      safeDismiss();
    }
  } else {
    // 아직 로드되지 않은 상태라면 지연 없이 바로 결과 화면으로 이동하고 다음 광고 로드
    preloadInterstitialAd();
    onDismiss();
  }
}

// ─────────────────────────────────────────────────────────────
// 2. 앱 오프닝 광고 (App Open Ad) 관리자
// ─────────────────────────────────────────────────────────────
let appOpenAdInstance: AppOpenAd | null = null;
let isAppOpenLoaded = false;

/**
 * 앱 진입 시 앱 오프닝 광고 로드 및 표시
 */
export function loadAndShowAppOpenAd() {
  if (Platform.OS === 'web') return;

  try {
    const adUnitId = getAppOpenAdUnitId();
    appOpenAdInstance = AppOpenAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });

    const unsubscribeLoaded = appOpenAdInstance.addAdEventListener(
      AdEventType.LOADED,
      () => {
        unsubscribeLoaded();
        isAppOpenLoaded = true;
        try {
          appOpenAdInstance?.show();
        } catch (e) {
          console.log('[AdMob] AppOpen show error:', e);
        }
      }
    );

    appOpenAdInstance.addAdEventListener(AdEventType.CLOSED, () => {
      isAppOpenLoaded = false;
    });

    appOpenAdInstance.addAdEventListener(AdEventType.ERROR, (error) => {
      isAppOpenLoaded = false;
      console.log('[AdMob] AppOpen error:', error);
    });

    appOpenAdInstance.load();
  } catch (err) {
    console.log('[AdMob] AppOpen load exception:', err);
  }
}
