import React from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LottoProvider, useLotto } from './src/context/LottoContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { StatisticsScreen } from './src/screens/StatisticsScreen';
import { ResultScreen } from './src/screens/ResultScreen';
import { VisualizationScreen } from './src/screens/VisualizationScreen';
import { AdMobBanner } from './src/components/AdMobBanner';
import { COLORS } from './src/constants/theme';
import { Home, BarChart2, Award, PieChart } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

function MainNavigation() {
  const { isDarkMode } = useLotto();

  const headerBg = isDarkMode ? '#0F172A' : COLORS.cardBg;
  const headerBorder = isDarkMode ? '#334155' : COLORS.border;
  const headerText = isDarkMode ? '#F8FAFC' : COLORS.textPrimary;
  const tabBg = isDarkMode ? '#0F172A' : COLORS.cardBg;
  const tabBorder = isDarkMode ? '#334155' : COLORS.border;

  return (
    <View style={{ flex: 1, backgroundColor: headerBg }}>
      <NavigationContainer>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Tab.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: headerBg,
              borderBottomWidth: 1,
              borderBottomColor: headerBorder,
              elevation: 0,
              shadowOpacity: 0,
            },
            headerTitleStyle: {
              color: headerText,
              fontSize: 17,
              fontWeight: '800',
            },
            headerTitleAlign: 'center',
            tabBarStyle: {
              backgroundColor: tabBg,
              borderTopWidth: 1,
              borderTopColor: tabBorder,
              height: 68,
              paddingBottom: 8,
              paddingTop: 4,
            },
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: isDarkMode ? '#94A3B8' : COLORS.textMuted,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              marginTop: 2,
            },
          }}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{
              title: '로또번호 발생기',
              tabBarLabel: '메인',
              tabBarIcon: ({ color }) => (
                <Home color={color} size={22} />
              ),
            }}
          />

          <Tab.Screen
            name="Statistics"
            component={StatisticsScreen}
            options={{
              title: '통계 자료 리스트',
              tabBarLabel: '통계',
              tabBarIcon: ({ color }) => (
                <BarChart2 color={color} size={22} />
              ),
            }}
          />

          <Tab.Screen
            name="Result"
            component={ResultScreen}
            options={{
              title: '발생번호 확인',
              tabBarLabel: '발생번호',
              tabBarIcon: ({ color }) => (
                <Award color={color} size={22} />
              ),
            }}
          />

          <Tab.Screen
            name="Visualization"
            component={VisualizationScreen}
            options={{
              title: '확률 시각화 파이프라인',
              tabBarLabel: '확률 시각화',
              tabBarIcon: ({ color }) => (
                <PieChart color={color} size={22} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>

      {/* 앱의 모든 화면 맨 밑바닥에 항상 고정되는 구글 애드몹 하단 배너 광고 */}
      <AdMobBanner isDarkMode={isDarkMode} />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LottoProvider>
        <MainNavigation />
      </LottoProvider>
    </SafeAreaProvider>
  );
}
