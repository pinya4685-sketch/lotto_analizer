import React, { createContext, useContext, useState, useEffect } from 'react';
import { LottoDraw, QuantGame, DeathZoneResult, QuantFilterPipelineStats, UserFilterSettings } from '../types/lotto';
import { fetchLottoDraw, OFFLINE_DB } from '../services/lottoApi';
import { 
  calculateDeathZone, 
  generateCombinations, 
  generateContrarian, 
  generateFilterPipelineStats, 
  calculateACValue,
  parseFilterSettings
} from '../utils/quantEngine';

export const DEFAULT_USER_FILTERS: UserFilterSettings = {
  includedNums: [],
  excludedNums: [],
  filterValues: {
    '번호 추출 방법': '최근 출현 (AI 최적화)',
    '과거 당첨 제외 필터': '3등까지 제외',
    '이월수 제외 필터': '2회 이상 제외',
    '연속 번호 제외 필터': '2개 연속 이상 제외',
    '번호합 범위 필터': '범위 : 85 ~ 122',
    '앞수합 범위 필터': '범위 : 20 ~ 40',
    '뒷수합 범위 필터': '범위 : 70 ~ 105',
    '첫수합 범위 필터': '범위 : 5 ~ 10',
    '끝수합 범위 필터': '범위 : 20 ~ 35',
    'AC값 범위 필터': '7이상',
    '홀 : 짝 비율 필터': '홀 : 짝 = 3 : 3 (표준)',
    '동일 색상 제한 필터': '동일 색상 최대 4개',
  },
  stepToggles: {
    1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true,
    9: true, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true,
    17: true, 18: true, 19: true, 20: true, 21: true, 22: true, 23: true
  },
  sumMin: 85,
  sumMax: 122,
  frontSumMin: 20,
  frontSumMax: 40,
  backSumMin: 70,
  backSumMax: 105,
  acMin: 7,
  oddEvenRatio: '3:3',
  maxColorCount: 4,
};

interface LottoContextType {
  latestDraw: LottoDraw;
  isEngineRunning: boolean;
  deathZoneResult: DeathZoneResult | null;
  regularGames: QuantGame[];
  contrarianGames: QuantGame[];
  pipelineStats: QuantFilterPipelineStats | null;
  savedGames: number[][];
  isDarkMode: boolean;
  userFilters: UserFilterSettings;
  updateUserFilters: (newFilters: Partial<UserFilterSettings>) => void;
  toggleTheme: () => void;
  runQuantAnalysis: () => void;
  saveNumberCombination: (nums: number[]) => void;
  deleteSavedNumberCombination: (index: number) => void;
}

const LottoContext = createContext<LottoContextType | undefined>(undefined);

export const LottoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [latestDraw, setLatestDraw] = useState<LottoDraw>({
    drwNo: 1239,
    drwNoDate: '2026-08-29',
    numbers: [11, 13, 22, 32, 33, 36],
    bnusNo: 8,
    firstWinamnt: 2214789375,
    firstPrzwnerCo: 13,
  });

  const [isEngineRunning, setIsEngineRunning] = useState<boolean>(false);
  const [deathZoneResult, setDeathZoneResult] = useState<DeathZoneResult | null>(null);
  const [regularGames, setRegularGames] = useState<QuantGame[]>([]);
  const [contrarianGames, setContrarianGames] = useState<QuantGame[]>([]);
  const [pipelineStats, setPipelineStats] = useState<QuantFilterPipelineStats | null>(null);
  const [savedGames, setSavedGames] = useState<number[][]>([
    [6, 16, 23, 26, 33, 45],
    [2, 7, 20, 25, 37, 40]
  ]);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [userFilters, setUserFilters] = useState<UserFilterSettings>(DEFAULT_USER_FILTERS);

  const updateUserFilters = (newFilters: Partial<UserFilterSettings>) => {
    setUserFilters(prev => ({
      ...prev,
      ...newFilters,
      // 만약 filterValues나 includedNums/excludedNums가 갱신되면 파싱된 수치도 동기화
      ...parseFilterSettings(
        newFilters.filterValues || prev.filterValues,
        newFilters.includedNums !== undefined ? newFilters.includedNums : prev.includedNums,
        newFilters.excludedNums !== undefined ? newFilters.excludedNums : prev.excludedNums,
        newFilters.stepToggles || prev.stepToggles
      )
    }));
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const saveNumberCombination = (nums: number[]) => {
    setSavedGames(prev => [nums, ...prev]);
  };

  const deleteSavedNumberCombination = (index: number) => {
    setSavedGames(prev => prev.filter((_, idx) => idx !== index));
  };

  useEffect(() => {
    fetchLottoDraw().then((draw) => {
      setLatestDraw(draw);
    });
  }, []);

  const runQuantAnalysis = () => {
    setIsEngineRunning(true);

    setTimeout(() => {
      const deathResult = calculateDeathZone(OFFLINE_DB);
      setDeathZoneResult(deathResult);

      const prevAC = calculateACValue(latestDraw.numbers);
      const regular = generateCombinations(deathResult, latestDraw.numbers, prevAC, 5, userFilters);
      const contrarian = generateContrarian(regular, deathResult, latestDraw.numbers, prevAC, 5, userFilters);

      setRegularGames(regular);
      setContrarianGames(contrarian);

      const stats = generateFilterPipelineStats(
        deathResult.deathZone.length,
        regular.length,
        contrarian.length
      );
      setPipelineStats(stats);

      setIsEngineRunning(false);
    }, 1200);
  };

  return (
    <LottoContext.Provider
      value={{
        latestDraw,
        isEngineRunning,
        deathZoneResult,
        regularGames,
        contrarianGames,
        pipelineStats,
        savedGames,
        isDarkMode,
        userFilters,
        updateUserFilters,
        toggleTheme,
        runQuantAnalysis,
        saveNumberCombination,
        deleteSavedNumberCombination,
      }}
    >
      {children}
    </LottoContext.Provider>
  );
};


export const useLotto = () => {
  const context = useContext(LottoContext);
  if (!context) {
    throw new Error('useLotto must be used within a LottoProvider');
  }
  return context;
};
