const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo Config Plugin: Google Mobile Ads Kotlin/SDK 버전 충돌 해결
 *
 * 문제:
 *   react-native-google-mobile-ads@16.5.0 이 사용하는 play-services-ads:25.4.0 은
 *   Kotlin 2.3+ 컴파일러로 빌드된 .aar 파일을 포함함.
 *   EAS 빌드 서버의 Kotlin 버전(2.1.x)으로는 해당 메타데이터를 읽지 못해 빌드 실패.
 *
 * 해결:
 *   1. rootProject build.gradle에 ext.kotlinVersion 주입 (서브모듈에서 읽어감)
 *   2. app/build.gradle에 resolutionStrategy 추가:
 *      play-services-ads 를 Kotlin 2.1 호환 버전(23.6.0)으로 강제 다운그레이드
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
const KOTLIN_VERSION = '2.1.21';
const PLAY_SERVICES_ADS_VERSION = '23.6.0';
const GOOGLE_UMP_VERSION = '3.0.0';

// ──────────────────────────────────────────────────────────────
// 1. rootProject/build.gradle: ext.kotlinVersion 주입
// ──────────────────────────────────────────────────────────────
function withRootKotlinVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // ext.kotlinVersion 이미 있으면 값 교체
      if (contents.includes('kotlinVersion')) {
        contents = contents.replace(
          /kotlinVersion\s*=\s*["'][^"']+["']/g,
          `kotlinVersion = "${KOTLIN_VERSION}"`
        );
      } else {
        // 없으면 buildscript 블록 안에 삽입
        contents = contents.replace(
          /^buildscript\s*\{/m,
          `buildscript {\n    ext {\n        kotlinVersion = "${KOTLIN_VERSION}"\n    }`
        );
      }

      // classpath kotlin-gradle-plugin 버전도 교체
      contents = contents.replace(
        /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"']+["']\)/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}")`
      );
      contents = contents.replace(
        /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin["']\)/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}")`
      );

      config.modResults.contents = contents;
    }
    return config;
  });
}

// ──────────────────────────────────────────────────────────────
// 2. app/build.gradle: resolutionStrategy 주입
//    play-services-ads 25.4.0 → 23.6.0 강제 다운그레이드
// ──────────────────────────────────────────────────────────────
function withAdMobResolutionStrategy(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      const RESOLUTION_BLOCK = `
    // ── AdMob SDK Kotlin 호환성 패치 (by withGoogleAdsKotlinFix) ──
    configurations.all {
        resolutionStrategy {
            force "com.google.android.gms:play-services-ads:${PLAY_SERVICES_ADS_VERSION}"
            force "com.google.android.ump:user-messaging-platform:${GOOGLE_UMP_VERSION}"
        }
    }
    // ────────────────────────────────────────────────────────────
`;

      // 이미 삽입된 경우 중복 방지
      if (!contents.includes('AdMob SDK Kotlin 호환성 패치')) {
        // android { ... } 블록 안의 첫 줄 다음에 삽입
        contents = contents.replace(
          /^android\s*\{/m,
          `android {${RESOLUTION_BLOCK}`
        );
        config.modResults.contents = contents;
      }
    }
    return config;
  });
}

// ──────────────────────────────────────────────────────────────
// 최종 플러그인 내보내기 (두 패치 합성)
// ──────────────────────────────────────────────────────────────
module.exports = function withGoogleAdsKotlinFix(config) {
  config = withRootKotlinVersion(config);
  config = withAdMobResolutionStrategy(config);
  return config;
};
