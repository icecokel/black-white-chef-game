import type { Match } from "./match";
import type { Judge } from "./judge";

export type RoundStatus = "picking" | "cooking" | "judging" | "completed";
export type JudgingResult = "pass" | "pending" | "fail";

export interface Round3State {
  matches: Match[]; // 3번의 매치 (100인, 50인, 10인)
  currentMatchIndex: number; // 0, 1, 2
  judges: Judge[]; // 현재 생존한 심사위원
  blackTeamScore: number;
  whiteTeamScore: number;
  userPrediction: "BLACK" | "WHITE" | null;
}

export interface Round2State {
  phase: "picking" | "revealing_user" | "revealing_random" | "summary";
  userPicks: string[]; // chef outcome prediction (max 2) - chefId
  highlightMatches: string[]; // ids of matches to highlight (random 3)
  currentRevealIndex: number; // index for sequential reveal
}

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  matches?: Match[]; // 2라운드용 매치 정보 (Round 2)
  round2State?: Round2State; // 2라운드 상태 (Round 2)
  round3State?: Round3State; // 3라운드 상태 (Round 3)
  cookingChefIds: string[]; // 요리 중인 쉐프 ID
  judgingQueue: string[]; // 심사 대기 큐 (요리 완료된 쉐프 ID)
  currentJudgingIndex: number; // 현재 심사 인덱스
  passedChefIds: string[]; // 통과한 쉐프 ID 목록
  pendingChefIds: string[]; // 보류 중인 쉐프 ID 목록
  eliminatedChefIds: string[]; // 탈락한 쉐프 ID 목록
  targetPassCount: number; // 목표 통과 인원 (Round 1 = 20)
  userPickLimit: number; // 유저 선택 제한 (Round 1 = 2)
  cycleComplete: boolean; // 1사이클 완료 여부
  messageLog: string[]; // 메시지 로그
}

export const ROUND_1_TARGET_PASS_COUNT = 20;
export const ROUND_1_USER_PICK_LIMIT = 5;
