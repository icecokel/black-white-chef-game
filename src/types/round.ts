export type RoundStatus = "picking" | "judging" | "completed";
export type JudgingStep = "cooking" | "judging" | "result";

export interface Round {
  roundNumber: number;
  status: RoundStatus;
  judgingQueue: string[]; // 채점 대기 큐 (쉐프 ID)
  currentJudgingIndex: number; // 현재 채점 인덱스
  currentStep: JudgingStep; // 현재 단계
  passedChefIds: string[]; // 통과한 쉐프 ID 목록
  eliminatedChefIds: string[]; // 탈락한 쉐프 ID 목록
  targetPassCount: number; // 목표 통과 인원 (Round 1 = 20)
  userPickLimit: number; // 유저 선택 제한 (Round 1 = 2)
}

export const ROUND_1_TARGET_PASS_COUNT = 20;
export const ROUND_1_USER_PICK_LIMIT = 2;
