const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * EAS 빌드 시 Kotlin Gradle Plugin 버전을 play-services-ads:25.4.0과 호환되는
 * 버전으로 강제 고정하는 Expo Config Plugin.
 *
 * react-native-google-mobile-ads의 build.gradle은
 * getExtOrDefault('kotlinVersion', '1.8.22') 방식으로 rootProject.ext.kotlinVersion을 읽음.
 * 따라서 ext 블록에 kotlinVersion을 명시하고 classpath도 교체해야 함.
 *
 * @param {import('@expo/config-plugins').ExpoConfig} config
 */
const KOTLIN_VERSION = '2.1.21';

module.exports = function withKotlinGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      let contents = config.modResults.contents;

      // 1. classpath의 kotlin-gradle-plugin 버전 교체 (버전 명시된 경우)
      contents = contents.replace(
        /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin:[^"']+["']\)/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}")`
      );

      // 2. classpath의 kotlin-gradle-plugin 버전 교체 (버전 미명시된 경우)
      contents = contents.replace(
        /classpath\(["']org\.jetbrains\.kotlin:kotlin-gradle-plugin["']\)/g,
        `classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:${KOTLIN_VERSION}")`
      );

      // 3. ext 블록에 kotlinVersion 추가/교체
      if (contents.includes('kotlinVersion')) {
        // 이미 kotlinVersion이 있으면 값만 교체
        contents = contents.replace(
          /kotlinVersion\s*=\s*["'][^"']+["']/g,
          `kotlinVersion = "${KOTLIN_VERSION}"`
        );
      } else {
        // kotlinVersion이 없으면 buildscript { 바로 뒤에 ext 블록 삽입
        contents = contents.replace(
          /^buildscript\s*\{/m,
          `buildscript {\n    ext {\n        kotlinVersion = "${KOTLIN_VERSION}"\n    }`
        );
      }

      config.modResults.contents = contents;
    }
    return config;
  });
};
