export interface LottoDraw {
  drwNo: number;
  drwNoDate: string;
  numbers: number[];
  bnusNo: number;
  firstWinamnt: number;
  firstPrzwnerCo: number;
}

export interface DeathZoneResult {
  deathZone: number[];
  coldNumbers: number[];
  overheatedDigits: number[];
  extinctColumns: number[];
  excludedSumBand: {
    bandStart: number;
    bandEnd: number;
    bandName: string;
  };
}

export interface QuantGame {
  id: string;
  type: 'regular' | 'contrarian';
  numbers: number[];
  score: number;
  tags: string[];
  probabilityIndex: string;
}

export interface QuantFilterPipelineStats {
  initialCombinations: number;
  afterDeathZoneCount: number;
  afterQuantFiltersCount: number;
  regularCombinationsCount: number;
  contrarianCombinationsCount: number;
  compressionRatio: string;
}

export interface UserFilterSettings {
  includedNums: number[];
  excludedNums: number[];
  filterValues: Record<string, string>;
  stepToggles: Record<number, boolean>;
  // 파싱된 수치 제약 조건
  sumMin?: number;
  sumMax?: number;
  frontSumMin?: number;
  frontSumMax?: number;
  backSumMin?: number;
  backSumMax?: number;
  firstSumMin?: number;
  firstSumMax?: number;
  lastSumMin?: number;
  lastSumMax?: number;
  acMin?: number;
  oddEvenRatio?: string; // 예: "3:3", "4:2", "5:1", "6:0", "전체"
  consecutiveLimit?: number; // 예: 2 (2개 연속 이상 제외)
  carryOverLimit?: number; // 예: 이월수 2회 이상 제외
  maxColorCount?: number; // 동일 색상 최대 개수 (예: 4)
}

