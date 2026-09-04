import React, { createContext, useContext, useState, useEffect } from 'react';
import { LottoDraw, QuantGame, DeathZoneResult, QuantFilterPipelineStats } from '../types/lotto';
import { fetchLottoDraw, OFFLINE_DB } from '../services/lottoApi';
import { 
  calculateDeathZone, 
  generateCombinations, 
  generateContrarian, 
  generateFilterPipelineStats, 
  calculateACValue 
} from '../utils/quantEngine';

interface LottoContextType {
  latestDraw: LottoDraw;
  isEngineRunning: boolean;
  deathZoneResult: DeathZoneResult | null;
  regularGames: QuantGame[];
  contrarianGames: QuantGame[];
  pipelineStats: QuantFilterPipelineStats | null;
  savedGames: number[][];
  isDarkMode: boolean;
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
      const regular = generateCombinations(deathResult, latestDraw.numbers, prevAC, 5);
      const contrarian = generateContrarian(regular, deathResult, latestDraw.numbers, prevAC, 5);

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
