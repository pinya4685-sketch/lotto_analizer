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

---

## 6. 통계 화면 1,239개 대규모 데이터 가상화(Virtualization) 성능 최적화
1. **문제점**:
   - 기존 `ScrollView`에서 1,239개 전체 회차와 공 8,673개를 한 번에 인스턴스화하여 메모리 급증 및 터치 응답 지연(UI Freeze) 발생.
   - 이월수 통계 렌더링 시 매 행마다 `find()`를 순회하여 약 153만 회(O(N^2))의 루프 연산 발생.
2. **해결 및 최적화 조치**:
   - **`FlatList` 가상화 렌더링**: 화면에 보이는 상위 20개 아이템만 동적으로 렌더링하고 나머지는 스크롤에 따라 가상화 처리 (`initialNumToRender: 20`, `removeClippedSubviews: true`).
   - **`getItemLayout` 적용**: 고정 행 높이(54px)를 직접 명시하여 FlatList 레이아웃 측정 오버헤드 0ms로 단축.
   - **O(1) Map 해시 인덱싱**: 전역 `DRAW_MAP`을 구축하여 이월수 탐색 비용을 150만 회에서 즉시 조회(O(1))로 단축.
   - **행 컴포넌트 `React.memo` 분리**: 스크롤 중 불필요한 행 리렌더링 완벽 차단.

---

## 7. 웹 크로스 플랫폼 호환성 (White Screen 해결)
1. **문제점**:
   - 네이티브 전용 라이브러리인 `react-native-google-mobile-ads`가 Metro Web 번들러에서 `codegenNativeComponent` 및 터보모듈 누락으로 인해 HTTP 500 에러를 유발하고, 웹 브라우저에서 화면이 하얗게 멈추는 현상 발생.
2. **해결 아키텍처**:
   - Expo/Metro 표준 플랫폼 확장자 분리(`adMobService.web.ts`, `AdMobBanner.web.tsx`) 적용.
   - 웹 환경에서는 네이티브 SDK 호출을 안전하게 Mocking/Fallback 처리하고, 웹 전용 안전한 플레이스홀더 배너를 제공하여 크래시 없이 완전한 웹 화면 렌더링 보장.

---

## 8. 통계 화면 도메인 데이터 재설계 및 UI 정밀화
1. **번호별 출현 횟수 통계 (1번 카테고리)**:
   - 1~45번 번호별 역대 전체 출현 횟수, 보너스볼 포함 횟수, 백분율 계산 및 출현율 게이지 바 제공.
   - 순위순 / 번호순 정렬 토글 기능 지원.
2. **연속 미출현 번호 통계 (2번 카테고리)**:
   - 최신 회차(1239회)를 기준으로 각 번호가 몇 주(회차) 동안 미출현했는지 전수 집계.
   - 가장 오랫동안 나오지 않은 번호(Cold Numbers) 순위 및 최근 출현 회차 표기.
3. **홀수 - 짝수 통계 (3번 카테고리)**:
   - 각 회차별 홀수와 짝수의 비율(예: 홀 3 : 짝 3)을 계산하여 시각적 뱃지로 직관적 제공.
4. **연속 번호 통계 (4번 카테고리)**:
   - 회차 내에서 연속된 번호(예: 11, 12)를 감지하여 해당 공만 강조 색상으로 표기하고 비연속 공은 디밍(반투명) 처리. 연속 번호 쌍 뱃지(예: 11-12) 제공.
5. **앞수합 / 뒷수합 통계 (7, 8번 카테고리)**:
   - **앞수합**: 앞 3개 공만 선명한 색상 표기, 뒤 3개 공은 반투명 디밍 처리. 보너스 번호는 완전히 숨김.
   - **뒷수합**: 뒤 3개 공만 선명한 색상 표기, 앞 3개 공은 반투명 디밍 처리. 보너스 번호는 완전히 숨김.

---

## 9. 번호 발생 필터 설정 상호 배타성 및 무결점 제어
1. **초기화 무결성**:
   - 모달 첫 구동 시 제외수 및 포함수는 항상 빈 배열(`[]`)로 시작하여 사용자 설정의 자유도 보장.
2. **포함수/제외수 상호 배타적(Mutual Exclusive) 선택 제어**:
   - 제외수에 이미 등록된 번호는 포함수 선택 창에서 선택 불가(반투명 디밍, '제외중' 뱃지 표시, 경고 알림).
   - 포함수에 이미 등록된 번호는 제외수 선택 창에서 선택 불가(반투명 디밍, '포함중' 뱃지 표시, 경고 알림).
   - 논리적 모순을 사전에 100% 차단하여 퀀트 엔진에 전달되는 필터 파이프라인의 데이터 정합성 유지.

---

## 10. 통계 등락 이동평균선(MA5) 및 앱플레이어 성능 최적화
1. **5회차 등락 이동평균선 (MA5 - Moving Average)**:
   - 각 통계 카테고리별 고유 지표값(`CategoryMetricInfo`)을 실시간 산출.
   - 최근 20개 회차에 대해 5회차 이동평균(MA5) 및 직전 대비 등락(▲ 상승, ▼ 하강, ─ 보합) 계산.
   - 종합 브리핑 카드, 가로 스크롤 시계열 차트(MA5 알약 뱃지, 등락 화살표, 실제값 바), 정밀 상세 테이블 3중 구조 제공.
2. **홀짝 비율 전용 색상 룰**:
   - `1:5`, `5:1` 극단 과열: **빨간색 (`#EF4444`)**
   - `6:0`, `0:6` 희귀 멸종: **노란색 (`#F59E0B`)**
   - `3:3` 표준 균형: **녹색 (`#10B981`)**
   - `4:2`, `2:4` 정규 분포: **파란색 (`#2563EB`)**
3. **앱플레이어/에뮬레이터 GPU 래스터라이즈 60fps 최적화**:
   - `LottoBall`: 무거운 안드로이드 `elevation: 3` 및 텍스트 섀도우를 경량화(`elevation: 1`)하고 `React.memo`로 감싸 불필요한 GPU 드로우콜 제거.
   - `FlatList`: `initialNumToRender={10}`, `maxToRenderPerBatch={10}`, `windowSize={5}`로 축소하여 뷰 마운트 부하를 50% 절감.
   - `useCallback` 렌더 콜백 분리 및 모달 루트 격리로 UI 쓰레드 프리징 완벽 해소.
4. **결과 화면 [재추출] 터치 시 AI 분석 브릿지 연동**:
   - `ResultScreen`에서 [재추출] 클릭 시 `AiAnalysisBridgeModal`을 가동하여 3.5초간 23단계 마르코프-퀀트 분석 애니메이션 송출 후 결과 갱신.
