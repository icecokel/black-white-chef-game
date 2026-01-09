export type RoundStatus = "picking" | "cooking" | "judging" | "completed";
import type { Match } from "./match";
export type JudgingResult = "pass" | "pending" | "fail";

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  matches?: Match[]; // 2라운드용 매치 정보
  cookingChefIds: string[]; // 요리 중인 쉐프 ID
  judgingQueue: string[]; // 채점 대기 큐 (요리 완료된 쉐프 ID)
  currentJudgingIndex: number; // 현재 채점 인덱스
  passedChefIds: string[]; // 통과한 쉐프 ID 목록
  pendingChefIds: string[]; // 보류 중인 쉐프 ID 목록
  eliminatedChefIds: string[]; // 탈락한 쉐프 ID 목록
  targetPassCount: number; // 목표 통과 인원 (Round 1 = 20)
  userPickLimit: number; // 유저 선택 제한 (Round 1 = 2)
  cycleComplete: boolean; // 1사이클 완료 여부
  messageLog: string[]; // 메시지 로그
}

export const ROUND_1_TARGET_PASS_COUNT = 20;
export const ROUND_1_USER_PICK_LIMIT = 2;
