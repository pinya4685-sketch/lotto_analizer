/**
 * Web 플랫폼 전용 AdMob 서비스 Mock
 * - 웹 브라우저 환경에서 react-native-google-mobile-ads 네이티브 모듈 로딩 시 발생하는 500 에러 원천 방지
 */
export const ADMOB_REAL_IDS = {
  APP_ID: 'ca-app-pub-5304943972328333~1144976491',
  BANNER: 'ca-app-pub-5304943972328333/7167459365',
  INTERSTITIAL: 'ca-app-pub-5304943972328333/8847492682',
  APP_OPEN: 'ca-app-pub-5304943972328333/2306135060',
};

export const ADMOB_TEST_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
};

export const USE_TEST_ADS = true;

export function getBannerAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.BANNER : ADMOB_REAL_IDS.BANNER;
}

export function getInterstitialAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.INTERSTITIAL : ADMOB_REAL_IDS.INTERSTITIAL;
}

export function getAppOpenAdUnitId(): string {
  return USE_TEST_ADS ? ADMOB_TEST_IDS.APP_OPEN : ADMOB_REAL_IDS.APP_OPEN;
}

export function preloadInterstitialAd() {
  // 웹 환경: no-op
}

export function showInterstitialAd(onDismiss: () => void) {
  // 웹 환경: 즉시 콜백 호출
  onDismiss();
}

export function loadAndShowAppOpenAd() {
  // 웹 환경: no-op
}
