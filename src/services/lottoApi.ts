import LOTTO_DATA, { LottoRecord } from '../data/lottoData';
import { LottoDraw } from '../types/lotto';

// 오프라인 로컬 DB (1회차 ~ 1239회차 전체)
export const OFFLINE_DB: LottoRecord[] = LOTTO_DATA;

// 오프라인 DB 조회 함수
export const fetchLottoDraw = async (drawNo?: number): Promise<LottoDraw> => {
  const target = drawNo 
    ? OFFLINE_DB.find(d => d.draw === drawNo) || OFFLINE_DB[0]
    : OFFLINE_DB[0];

  return {
    drwNo: target.draw,
    drwNoDate: '2026-08-29',
    numbers: target.nums,
    bnusNo: target.bonus,
    firstWinamnt: 2214789375,
    firstPrzwnerCo: 13,
  };
};

export const getOfflineDbCount = (): number => OFFLINE_DB.length;
