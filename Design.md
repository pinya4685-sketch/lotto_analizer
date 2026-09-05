# AI 로또 분석기 (Lotto Analyzer) - 시스템 아키텍처 및 설계 문서

## 1. 프로젝트 개요
- **앱 이름**: AI 로또 분석 (`com.lottoai.analizer`)
- **플랫폼**: React Native / Expo (SDK 57)
- **목적**: 1회차부터 최신 1239회차까지의 실제 역대 로또 당첨 데이터를 기반으로 한 AI 퀀트 분석, 필터링 및 번호 예측/추천 하이브리드 모바일 애플리케이션
- **수익화 모델**: 구글 애드몹 (하단 고정 스마트 배너 + 번호 생성 트리거 전면 광고)

---

## 2. 기술 스택 & 환경
- **프레임워크**: Expo SDK 57 (SDK 57.0.20 호환 모드)
- **코어 런타임**: React 19.2.3, React Native 0.86.3
- **네비게이션**: `@react-navigation/bottom-tabs` & `@react-navigation/native` v7
- **광고 플랫폼**: `react-native-google-mobile-ads` v16.3.4 (안정화 핀 고정)
  - Android Gradle 빌드 호환성: Kotlin 2.3.0 메타데이터 충돌을 회피하기 위해 `play-services-ads:25.0.0` 기반의 16.3.4 안정 버전을 채택하고, Expo SDK 57 표준 `kotlinVersion: 2.1.20`과 일치시켜 `pika-compiler:0.3.2-2.1.20` 의존성을 완벽하게 해소
- **빌드 시스템**: EAS (Expo Application Services) Build (Android AAB 타겟)

---

## 3. 디렉터리 및 모듈 구조
```
lotto_analizer/
├── App.tsx                     # 앱 진입점, 글로벌 테마/네비게이션 및 하단 배너 래퍼
├── app.json                    # Expo 매니페스트 및 플러그인(AdMob, Splash, BuildProperties) 설정
├── eas.json                    # EAS 빌드 프로필 (production app-bundle)
├── assets/                     # 5색 로또볼 앱 아이콘, 어댑티브 아이콘, 스플래시 이미지
├── src/
│   ├── context/
│   │   └── LottoContext.tsx    # 전역 상태 (다크모드, 최근 생성 번호, 보관함 데이터)
│   ├── screens/
│   │   ├── HomeScreen.tsx      # 홈 대시보드 (최신 당첨 결과, 퀀트 분석 실행 CTA)
│   │   └── ResultScreen.tsx    # 번호 생성 결과 화면 (정규 5게임 + 역발상 5게임)
│   ├── components/
│   │   ├── AdMobBanner.tsx     # 하단 고정형 AdMob 배너
│   │   ├── AdMobInterstitialModal.tsx # 번호 생성 인터랙션 전면 광고 모달
│   │   └── FeatureModals.tsx   # 1~1239회 당첨 이력 조회, 통계 모달 등
│   ├── services/
│   │   └── adMobService.ts     # 실제 AdMob ID 및 테스트 ID 관리
│   ├── data/
│   │   └── lottoData.ts        # 1~1239회 로컬 오프라인 로또 통계 데이터베이스
│   └── utils/
│       └── lottoEngine.ts      # 퀀트 필터링 및 난수 생성 알고리즘
```

---

## 4. 핵심 설정 및 해결된 빌드 이슈
1. **Expo SDK 57 설정 규격 준수**:
   - `app.json` 루트에서 비표준 프로퍼티인 `newArchEnabled` 및 구버전 `splash` 제거
   - `expo-splash-screen` 플러그인 방식으로 전환 및 최신 SDK 패치 버전(`~57.0.20`, `expo-build-properties@~57.0.17`) 동기화 완료
   - `npx expo-doctor` 21개 검사 항목 100% 통과 (0 error)
2. **Google Mobile Ads 및 Kotlin 컴파일러 호환성 해결**:
   - `react-native-google-mobile-ads`를 `16.3.4`로 고정하여 `play-services-ads:25.4.0`의 Kotlin 2.3.0 메타데이터 충돌 방지
   - `expo-build-properties`에서 `kotlinVersion: 2.1.20`을 설정하여 Expo SDK 57의 `io.github.lukmccall.pika:pika-compiler:0.3.2-2.1.20` 결합 의존성 오류(pika-compiler:0.3.2-2.1.21 부재)를 완전히 해결
   - `androidx.core:core:1.17.0`의 AAR 요구사항에 맞추어 `compileSdkVersion: 36`, `buildToolsVersion: 36.0.0`으로 설정 (targetSdkVersion은 35 유지)
   - 비표준 Gradle 치환 플러그인을 제거하고 Expo Managed Workflow 표준 파이프라인으로 복원

---

## 5. 구글 애드몹(AdMob) 3종 광고 아키텍처
1. **배너 광고 (`BannerAd`)**:
   - 앱의 모든 탭 화면 최하단에 항상 고정되는 `ANCHORED_ADAPTIVE_BANNER`
   - 웹 브라우저 크래시 방지용 가상 배너 및 네이티브 로드 실패 대응 폴백 완비
2. **전면 광고 (`InterstitialAd`)**:
   - 메인 대시보드에서 `[번호 발생]` 터치 시 백그라운드에서 사전 로드(`preloadInterstitialAd`)된 전면 광고 송출
   - 광고 시청 완료 또는 에러 시 안전하게 분석 브릿지 연출 및 결과 화면으로 이동
3. **앱 오프닝 광고 (`AppOpenAd`)**:
   - 앱 최초 구동 시 메인 네비게이션 진입 직전 오프닝 전면 광고 로드 및 송출
4. **테스트 / 출시 모드 전환 체계 (`USE_TEST_ADS`)**:
   - 구글 AdMob 계정의 본인인증 미완료 / 스토어 앱 미등록 상태에서는 구글 정책상 실제 광고 단위 ID로 광고가 서빙되지 않고 `ERROR_CODE_NO_FILL`이 반환됨.
   - 따라서 테스트 기기 및 에뮬레이터에서 정상 송출을 확인할 수 있도록 `USE_TEST_ADS: true`를 기본 활성화하여 공식 구글 테스트 광고로 동작하게 하고, 정식 승인 후 `false`로 손쉽게 실제 광고로 전환하도록 구현.

