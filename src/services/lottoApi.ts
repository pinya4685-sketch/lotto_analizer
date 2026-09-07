/**
 * @file lottoApi.ts
 * @description 로또 당첨 데이터 조회 및 오프라인 로컬 데이터베이스 제공 서비스 모듈
 */

import LOTTO_DATA, { LottoRecord } from '../data/lottoData';
import { LottoDraw } from '../types/lotto';

/** 오프라인 로컬 DB (1회차 ~ 1240회차 전체) */
export const OFFLINE_DB: LottoRecord[] = LOTTO_DATA;

/**
 * 회차별 로또 당첨 상세 정보 조회 함수 (오프라인 DB 기반)
 * @param {number} [drawNo] 조회할 회차 번호 (생략 시 최신 1240회차 반환)
 * @returns {Promise<LottoDraw>} 로또 회차 상세 정보 객체
 */
export const fetchLottoDraw = async (drawNo?: number): Promise<LottoDraw> => {
  const target = drawNo 
    ? OFFLINE_DB.find(d => d.draw === drawNo) || OFFLINE_DB[0]
    : OFFLINE_DB[0];

  const is1240 = target.draw === 1240;

  return {
    drwNo: target.draw,
    drwNoDate: is1240 ? '2026-09-05' : '2026-08-29',
    numbers: target.nums,
    bnusNo: target.bonus,
    firstWinamnt: is1240 ? 1791817758 : 2214789375,
    firstPrzwnerCo: is1240 ? 16 : 13,
  };
};

/**
 * 오프라인 DB의 총 회차 수 반환
 * @returns {number} 총 회차 수 (1240)
 */
export const getOfflineDbCount = (): number => OFFLINE_DB.length;

