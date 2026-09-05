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
- **광고 플랫폼**: `react-native-google-mobile-ads` v16.5.0
  - Android Gradle 빌드 호환성: Gradle resolutionStrategy를 통해 `play-services-ads:23.6.0`, `user-messaging-platform:3.0.0` 강제 지정 및 Kotlin 2.1.21 주입
- **빌드 시스템**: EAS (Expo Application Services) Build (Android AAB 타겟)

---

## 3. 디렉터리 및 모듈 구조
```
lotto_analizer/
├── App.tsx                     # 앱 진입점, 글로벌 테마/네비게이션 및 하단 배너 래퍼
├── app.json                    # Expo 매니페스트 및 플러그인(AdMob, Splash, Gradle) 설정
├── eas.json                    # EAS 빌드 프로필 (production app-bundle)
├── plugins/
│   └── withKotlinGradlePluginVersion.js  # Android 빌드용 Kotlin 및 AdMob SDK 해소 플러그인
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
2. **Google Mobile Ads Kotlin 호환성 보장**:
   - Gradle `withProjectBuildGradle` 및 `withAppBuildGradle` 커스텀 플러그인으로 Kotlin 2.1.21 설정 및 play-services-ads 23.6.0 강제 적용
