/**
 * Round 1 관련 액션들을 정의합니다.
 * - 쉐프 선택 (autoPick)
 * - 심사 시작/진행
 * - 요리 완료 처리
 */
import type { Chef } from "../types/chef";
import type { Round, JudgingResult } from "../types/round";
import { judgeChef } from "../utils/round-logic";

// 상수
const JUDGING_BATCH_SIZE = 4;
const COOKING_BATCH_SIZE = 4;

// 타입 정의
export interface JudgingBatchResult {
  chefs: Chef[];
  results: JudgingResult[];
  messages: string[];
}

export interface CookingResult {
  completedChefs: Chef[];
  messages: string[];
}

// 속도 기반 완료 순서 (높을수록 먼저 완료)
export const createSpeedWeightedOrder = (chefs: Chef[]): string[] => {
  return [...chefs]
    .sort((a, b) => {
      const speedA = a.stats.speed + Math.random() * 50;
      const speedB = b.stats.speed + Math.random() * 50;
      return speedB - speedA;
    })
    .map((c) => c.id);
};

// 자동 선택 로직
export const autoPickBlackChefsAction = (
  chefs: Chef[],
  currentRound: Round | null,
): { selectedIds: string[] } | null => {
  if (!currentRound || currentRound.status !== "picking") return null;

  const currentPicks = chefs.filter((c) => c.isPlayerPick);
  const needToPick = currentRound.userPickLimit - currentPicks.length;

  if (needToPick <= 0) return null;

  const availableChefs = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive" && !c.isPlayerPick,
  );

  const shuffled = [...availableChefs].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, needToPick);

  return { selectedIds: selected.map((c) => c.id) };
};

// 심사 시작 로직
export const startRound1JudgingAction = (
  chefs: Chef[],
  currentRound: Round | null,
): {
  cookingChefIds: string[];
  judgingQueue: string[];
  messageLog: string[];
} | null => {
  if (!currentRound || currentRound.status !== "picking") return null;

  const aliveBlackChefs = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive",
  );

  if (aliveBlackChefs.length === 0) return null;

  const cookingOrder = createSpeedWeightedOrder(aliveBlackChefs);

  const initialReady = cookingOrder.slice(0, COOKING_BATCH_SIZE);
  const remainingCooking = cookingOrder.slice(COOKING_BATCH_SIZE);

  const messageLog = [
    "🍳 라운드 1 심사 시작!",
    `🔥 ${aliveBlackChefs.length}명의 흑수저 쉐프가 동시에 요리를 시작합니다!`,
    ...initialReady.map((id) => {
      const chef = chefs.find((c) => c.id === id);
      return `🍽️ ${chef?.nickname} 요리 완료!`;
    }),
  ];

  return {
    cookingChefIds: remainingCooking,
    judgingQueue: initialReady,
    messageLog,
  };
};

// 요리 완료 처리 로직
export const advanceRound1CookingAction = (
  chefs: Chef[],
  currentRound: Round | null,
):
  | (CookingResult & { remainingCooking: string[]; completedIds: string[] })
  | null => {
  if (!currentRound || currentRound.status !== "judging") return null;

  const { cookingChefIds, passedChefIds, targetPassCount } = currentRound;

  if (passedChefIds.length >= targetPassCount) return null;
  if (cookingChefIds.length === 0) return null;

  const completedIds = cookingChefIds.slice(0, COOKING_BATCH_SIZE);
  const remainingCooking = cookingChefIds.slice(COOKING_BATCH_SIZE);

  const completedChefs = completedIds
    .map((id) => chefs.find((c) => c.id === id))
    .filter((c): c is Chef => c !== undefined);

  const messages = completedChefs.map(
    (chef) => `🍽️ ${chef.nickname} 요리 완료!`,
  );

  if (remainingCooking.length === 0) {
    messages.push("✨ 모든 쉐프의 요리가 완료되었습니다!");
  }

  return { completedChefs, messages, remainingCooking, completedIds };
};

// 심사 진행 로직 (배치 심사)
// 주의: 여기서는 judgeChef 결과를 그대로 기록. 슬롯 조정은 사이클 종료 시 처리.
export const judgeRound1BatchAction = (
  chefs: Chef[],
  currentRound: Round,
): {
  batchChefs: Chef[];
  results: JudgingResult[];
  messages: string[];
  newPassed: string[];
  newPending: string[];
  newEliminated: string[];
} | null => {
  const { judgingQueue, currentJudgingIndex } = currentRound;

  const batchIds = judgingQueue.slice(
    currentJudgingIndex,
    currentJudgingIndex + JUDGING_BATCH_SIZE,
  );
  const batch = batchIds
    .map((id) => chefs.find((c) => c.id === id))
    .filter((c): c is Chef => c !== undefined);

  if (batch.length === 0) return null;

  // judgeChef 결과 그대로 사용 (pass→pending 강제 변환 제거)
  const results: JudgingResult[] = batch.map((chef) => judgeChef(chef));

  const messages = batch.map((chef, i) => {
    const result = results[i];
    if (result === "pass") return `✅ ${chef.nickname} 통과!`;
    if (result === "pending") return `⏳ ${chef.nickname} 보류`;
    return `❌ ${chef.nickname} 탈락`;
  });

  return {
    batchChefs: batch,
    results,
    messages,
    newPassed: batchIds.filter((_, i) => results[i] === "pass"),
    newPending: batchIds.filter((_, i) => results[i] === "pending"),
    newEliminated: batchIds.filter((_, i) => results[i] === "fail"),
  };
};

// 보류자 재심사 로직
export const processPendingChefsAction = (
  chefs: Chef[],
  pendingChefIds: string[],
  remainingSlots: number,
): {
  chefsToPass: Chef[];
  chefsToEliminate: Chef[];
  messages: string[];
} => {
  const pendingChefs = pendingChefIds
    .map((id) => chefs.find((c) => c.id === id))
    .filter((c): c is Chef => c !== undefined)
    .sort((a, b) => {
      const sumA = Object.values(a.stats).reduce((acc, v) => acc + v, 0);
      const sumB = Object.values(b.stats).reduce((acc, v) => acc + v, 0);
      if (sumA !== sumB) return sumB - sumA;
      return a.id.localeCompare(b.id);
    });

  const chefsToPass = pendingChefs.slice(0, remainingSlots);
  const chefsToEliminate = pendingChefs.slice(remainingSlots);

  const passedNames = chefsToPass.map((c) => c.nickname).join(", ");
  const messages = [`📢 보류자 재심사 결과: ${passedNames} 추가 합격!`];

  return { chefsToPass, chefsToEliminate, messages };
};

// 탈락자 재심사 로직
export const processEliminatedChefsAction = (
  chefs: Chef[],
  eliminatedChefIds: string[],
  remainingSlots: number,
): {
  chefsToRevive: Chef[];
  messages: string[];
} => {
  const eliminatedChefs = eliminatedChefIds
    .map((id) => chefs.find((c) => c.id === id))
    .filter((c): c is Chef => c !== undefined)
    .sort((a, b) => {
      const sumA = Object.values(a.stats).reduce((acc, v) => acc + v, 0);
      const sumB = Object.values(b.stats).reduce((acc, v) => acc + v, 0);
      if (sumA !== sumB) return sumB - sumA;
      return a.id.localeCompare(b.id);
    });

  const chefsToRevive = eliminatedChefs.slice(0, remainingSlots);
  const revivedNames = chefsToRevive.map((c) => c.nickname).join(", ");

  const messages =
    chefsToRevive.length > 0
      ? [`🔄 탈락자 재심사 결과: ${revivedNames} 부활!`]
      : ["⚠️ 합격자 부족으로 라운드 종료"];

  return { chefsToRevive, messages };
};
