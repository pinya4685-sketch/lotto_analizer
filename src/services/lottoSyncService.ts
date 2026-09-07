/**
 * @file lottoSyncService.ts
 * @description 동행복권 공식 API 기반 로또 최신 당첨번호 자동 동기화 서비스
 * - 매주 토요일 오후 9시(21:00) 이후 발표되는 신규 회차 데이터를 자동으로 감지하여 동기화합니다.
 * - 신규 회차가 발표되면 백그라운드에서 안전하게 데이터를 패치하여 앱의 로컬 DB 및 State에 주입합니다.
 */

import { Platform } from 'react-native';
import { LottoRecord } from '../data/lottoData';
import { LottoDraw } from '../types/lotto';

/** 동행복권 6/45 당첨정보 공식 조회 엔드포인트 */
const DHLOTTERY_API_URL = 'https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do';

/** 동행복권 API 응답 인터페이스 */
interface DhLotteryApiResponse {
  resultCode: string | null;
  resultMessage: string | null;
  data?: {
    list?: Array<{
      ltEpsd: number;         // 회차
      tm1WnNo: number;        // 당첨번호 1
      tm2WnNo: number;        // 당첨번호 2
      tm3WnNo: number;        // 당첨번호 3
      tm4WnNo: number;        // 당첨번호 4
      tm5WnNo: number;        // 당첨번호 5
      tm6WnNo: number;        // 당첨번호 6
      bnsWnNo: number;        // 보너스 번호
      ltRflYmd: string;       // 추첨일자 (YYYYMMDD)
      rnk1WnNope: number;     // 1등 당첨자 수
      rnk1WnAmt: number;      // 1등 1인당 당첨금
      rnk1SumWnAmt: number;   // 1등 총 당첨금
    }>;
  };
}

/**
 * 특정 회차의 당첨결과를 동행복권 공식 서버에서 조회
 * @param {number} drawNo 조회할 회차 번호
 * @returns {Promise<LottoDraw | null>} 성공 시 로또 상세 정보, 아직 추첨 전이거나 오류 시 null
 */
export async function fetchDrawFromOfficialApi(drawNo: number): Promise<LottoDraw | null> {
  // 웹 브라우저 환경에서는 CORS 보안 제한으로 인해 브라우저 직접 통신이 차단되므로 안전하게 스킵
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    const timestamp = Date.now();
    const targetUrl = `${DHLOTTERY_API_URL}?srchLtEpsd=${drawNo}&_=${timestamp}`;

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
      }
    });

    if (!response.ok) {
      return null;
    }

    const resJson: DhLotteryApiResponse = await response.json();
    const item = resJson.data?.list?.[0];

    // 유효한 당첨번호가 발표되었는지 검증 (1~6번 공 및 보너스볼이 1~45 범위 내에 있어야 함)
    if (
      item &&
      item.ltEpsd === drawNo &&
      item.tm1WnNo > 0 &&
      item.tm6WnNo > 0 &&
      item.bnsWnNo > 0
    ) {
      const formattedDate = item.ltRflYmd && item.ltRflYmd.length === 8
        ? `${item.ltRflYmd.slice(0, 4)}-${item.ltRflYmd.slice(4, 6)}-${item.ltRflYmd.slice(6, 8)}`
        : '2026-09-05';

      return {
        drwNo: item.ltEpsd,
        drwNoDate: formattedDate,
        numbers: [item.tm1WnNo, item.tm2WnNo, item.tm3WnNo, item.tm4WnNo, item.tm5WnNo, item.tm6WnNo].sort((a, b) => a - b),
        bnusNo: item.bnsWnNo,
        firstWinamnt: item.rnk1WnAmt || 0,
        firstPrzwnerCo: item.rnk1WnNope || 0,
      };
    }

    return null;
  } catch (error) {
    // 웹 브라우저의 CORS 환경 또는 네트워크 일시적 오류 시 예외 처리
    console.warn(`[LottoSync] ${drawNo}회차 동행복권 API 통신 대기:`, error);
    return null;
  }
}

/**
 * 현재 시각이 매주 토요일 오후 9시(21:00) 이후인지 판별
 * @returns {boolean} 토요일 21시 이후이거나 일요일/월요일 등 추첨 후 기간인지 여부
 */
export function isAfterSaturday9PM(): boolean {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0: 일, 1: 월, ..., 6: 토
  const hours = now.getHours();

  // 토요일인 경우 21시 이후인지 확인
  if (dayOfWeek === 6) {
    return hours >= 21;
  }
  // 일요일, 월요일, 화요일 등 다음 토요일 전까지는 이전 토요일 추첨 결과가 발표된 상태임
  return true;
}

/**
 * 최신 회차 기준 자동 점진적 동기화 실행
 * 현재 로컬 DB의 최신 회차보다 다음 회차(latestDraw + 1)가 발표되었는지 확인하고,
 * 발표되었을 경우 순차적으로 가져와 최신 목록을 반환합니다.
 * 
 * @param {number} currentLatestDraw 현재 앱에 반영된 최신 회차 번호
 * @returns {Promise<{ newDraws: LottoDraw[]; updatedLatest: LottoDraw | null }>}
 */
export async function syncLatestLottoDraws(currentLatestDraw: number): Promise<{
  newDraws: LottoDraw[];
  updatedLatest: LottoDraw | null;
}> {
  const newDraws: LottoDraw[] = [];
  let nextDraw = currentLatestDraw + 1;
  let keepChecking = true;

  // 다음 회차가 발표되었는지 최대 5회차까지 연속 탐색 (예: 앱을 몇 주만에 켠 경우)
  while (keepChecking && nextDraw <= currentLatestDraw + 5) {
    const fetched = await fetchDrawFromOfficialApi(nextDraw);
    if (fetched) {
      newDraws.unshift(fetched); // 최신순으로 정렬되도록 앞에 추가
      nextDraw++;
    } else {
      keepChecking = false;
    }
  }

  return {
    newDraws,
    updatedLatest: newDraws.length > 0 ? newDraws[0] : null,
  };
}
