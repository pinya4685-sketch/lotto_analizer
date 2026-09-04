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
