const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * EAS 빌드 시 Kotlin Gradle Plugin 버전을 최신 Google Mobile Ads(play-services-ads:25.4.0)와 호환되는 2.1.20으로 명시적으로 주입하는 플러그인
 */
module.exports = function withKotlinGradlePluginVersion(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      config.modResults.contents = config.modResults.contents.replace(
        /classpath\(['"]org\.jetbrains\.kotlin:kotlin-gradle-plugin['"]\)/,
        'classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.20")'
      );
    }
    return config;
  });
};
