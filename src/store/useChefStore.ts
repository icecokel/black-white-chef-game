import { create } from "zustand";
import type { Chef, ChefRank } from "../types/chef";
import type { Round, JudgingResult } from "../types/round";
import {
  ROUND_1_TARGET_PASS_COUNT,
  ROUND_1_USER_PICK_LIMIT,
} from "../types/round";
import { generateAllChefs } from "../utils/chef-generator";
import { generateDish, MAIN_INGREDIENTS } from "../utils/dish-generator";
import { judgeChef, sortChefList } from "../utils/round-logic";

const JUDGING_BATCH_SIZE = 4; // 4명씩 채점
const COOKING_BATCH_SIZE = 4; // 4명씩 요리 완료

interface JudgingBatchResult {
  chefs: Chef[];
  results: JudgingResult[];
  messages: string[];
}

interface CookingResult {
  completedChefs: Chef[];
  messages: string[];
}

interface ChefStore {
  chefs: Chef[];
  currentRound: Round | null;

  initializeGame: () => void;
  getChefsByRank: (rank: ChefRank) => Chef[];
  getSortedChefs: () => Chef[];
  getAliveBlackChefs: () => Chef[];
  getUserPicks: () => Chef[];
  toggleUserPick: (chefId: string) => boolean;
  canPickMore: () => boolean;
  startRound1Judging: () => void;
  advanceRound1Cooking: () => CookingResult | null;
  advanceRound1Judging: () => JudgingBatchResult | null;
  startRound2: () => void;
  judgeMatch: (matchId: string) => void;
  isRoundComplete: () => boolean;
}

// 속도 기반 완료 순서 (높을수록 먼저 완료)
const createSpeedWeightedOrder = (chefs: Chef[]): string[] => {
  return [...chefs]
    .sort((a, b) => {
      // 속도(0~100) + 랜덤(0~50)
      // 랜덤 범위를 늘려(50) 속도가 낮아도 운이 좋으면 먼저 완료될 확률 부여
      const speedA = a.stats.speed + Math.random() * 50;
      const speedB = b.stats.speed + Math.random() * 50;
      return speedB - speedA;
    })
    .map((c) => c.id);
};

export const useChefStore = create<ChefStore>((set, get) => ({
  chefs: [],
  currentRound: null,

  initializeGame: () => {
    const newChefs = generateAllChefs();
    const newRound: Round = {
      roundNumber: 1,
      status: "picking",
      cookingChefIds: [],
      judgingQueue: [],
      currentJudgingIndex: 0,
      passedChefIds: [],
      pendingChefIds: [],
      eliminatedChefIds: [],
      targetPassCount: ROUND_1_TARGET_PASS_COUNT,
      userPickLimit: ROUND_1_USER_PICK_LIMIT,
      cycleComplete: false,
      messageLog: [],
    };
    set({ chefs: newChefs, currentRound: newRound });
  },

  getChefsByRank: (rank: ChefRank) => {
    return get().chefs.filter((chef) => chef.rank === rank);
  },

  getSortedChefs: () => {
    return sortChefList(get().chefs);
  },

  getAliveBlackChefs: () => {
    return get().chefs.filter(
      (chef) => chef.rank === "BLACK" && chef.status === "alive"
    );
  },

  getUserPicks: () => {
    return get().chefs.filter((chef) => chef.isPlayerPick);
  },

  toggleUserPick: (chefId: string) => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "picking") return false;

    const chef = chefs.find((c) => c.id === chefId);
    if (!chef || chef.rank !== "BLACK" || chef.status !== "alive") return false;

    const currentPicks = chefs.filter((c) => c.isPlayerPick);
    const isCurrentlyPicked = chef.isPlayerPick;

    if (isCurrentlyPicked) {
      set((state) => ({
        chefs: state.chefs.map((c) =>
          c.id === chefId ? { ...c, isPlayerPick: false } : c
        ),
      }));
      return true;
    }

    if (currentPicks.length >= currentRound.userPickLimit) {
      return false;
    }

    set((state) => ({
      chefs: state.chefs.map((c) =>
        c.id === chefId ? { ...c, isPlayerPick: true } : c
      ),
    }));
    return true;
  },

  canPickMore: () => {
    const { currentRound, chefs } = get();
    if (!currentRound) return false;
    const currentPicks = chefs.filter((c) => c.isPlayerPick);
    return currentPicks.length < currentRound.userPickLimit;
  },

  startRound1Judging: () => {
    const { currentRound } = get();
    if (!currentRound || currentRound.status !== "picking") return;

    const aliveBlackChefs = get().getAliveBlackChefs();
    // 속도 기반 요리 순서로 cookingChefIds 설정
    const cookingOrder = createSpeedWeightedOrder(aliveBlackChefs);

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            status: "judging",
            cookingChefIds: cookingOrder,
            judgingQueue: [],
            currentJudgingIndex: 0,
            cycleComplete: false,
            messageLog: ["🍳 라운드 1 심사 시작!"],
          }
        : null,
    }));
  },

  // 요리 완료 처리 - 4명씩 완료
  advanceRound1Cooking: () => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "judging") return null;

    const { cookingChefIds, passedChefIds, targetPassCount } = currentRound;

    // 이미 목표 달성 시 완료 처리
    if (passedChefIds.length >= targetPassCount) {
      return null;
    }

    // 요리 중인 쉐프가 없으면 null
    if (cookingChefIds.length === 0) {
      return null;
    }

    // 4명씩 요리 완료
    const completedIds = cookingChefIds.slice(0, COOKING_BATCH_SIZE);
    const remainingCooking = cookingChefIds.slice(COOKING_BATCH_SIZE);

    const completedChefs = completedIds
      .map((id) => chefs.find((c) => c.id === id))
      .filter((c): c is Chef => c !== undefined);

    const messages = completedChefs.map(
      (chef) => `🍽️ ${chef.nickname} 요리 완료!`
    );

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            cookingChefIds: remainingCooking,
            judgingQueue: [...state.currentRound.judgingQueue, ...completedIds],
            messageLog: [...state.currentRound.messageLog, ...messages],
          }
        : null,
    }));

    return { completedChefs, messages };
  },

  // 채점 대기 큐에서 4명씩 채점
  advanceRound1Judging: () => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "judging") return null;

    const {
      judgingQueue,
      currentJudgingIndex,
      passedChefIds,
      targetPassCount,
    } = currentRound;

    // 이미 목표 달성 시 모든 미합격자 탈락 처리 후 완료
    if (passedChefIds.length >= targetPassCount) {
      set((state) => {
        const updatedChefs = state.chefs.map((c) => {
          if (
            c.rank === "BLACK" &&
            c.status !== "eliminated" &&
            !passedChefIds.includes(c.id)
          ) {
            return {
              ...c,
              status: "eliminated" as const,
              eliminatedRound: currentRound.roundNumber,
            };
          }
          return c;
        });
        return {
          chefs: updatedChefs,
          currentRound: state.currentRound
            ? {
                ...state.currentRound,
                status: "completed",
                messageLog: [
                  ...state.currentRound.messageLog,
                  "🏆 라운드 1 완료!",
                ],
              }
            : null,
        };
      });
      return null;
    }

    // 남은 통과 가능 인원
    const remainingSlots = targetPassCount - passedChefIds.length;

    // 채점 대기 큐에서 채점할 쉐프가 없으면 null
    if (currentJudgingIndex >= judgingQueue.length) {
      return null;
    }

    // 4명씩 채점
    const batchIds = judgingQueue.slice(
      currentJudgingIndex,
      currentJudgingIndex + JUDGING_BATCH_SIZE
    );
    const batch = batchIds
      .map((id) => chefs.find((c) => c.id === id))
      .filter((c): c is Chef => c !== undefined);

    if (batch.length === 0) return null;

    // 각 쉐프 판정
    const rawResults = batch.map((chef) => judgeChef(chef));

    // 통과 수를 남은 슬롯으로 제한
    let passCount = 0;
    const results: JudgingResult[] = rawResults.map((result) => {
      if (result === "pass") {
        if (passCount < remainingSlots) {
          passCount++;
          return "pass";
        } else {
          return "pending";
        }
      }
      return result;
    });

    const messages = batch.map((chef, i) => {
      const result = results[i];
      if (result === "pass") return `✅ ${chef.nickname} 통과!`;
      if (result === "pending") return `⏳ ${chef.nickname} 보류`;
      return `❌ ${chef.nickname} 탈락`;
    });

    set((state) => {
      const updatedChefs = state.chefs.map((c) => {
        const idx = batchIds.indexOf(c.id);
        if (idx === -1) return c;

        const result = results[idx];
        if (result === "pending") {
          return { ...c, status: "pending" as const };
        } else if (result === "fail") {
          return {
            ...c,
            status: "eliminated" as const,
            eliminatedRound: currentRound.roundNumber,
          };
        }
        return c;
      });

      const newPassed = batchIds.filter((_, i) => results[i] === "pass");
      const newPending = batchIds.filter((_, i) => results[i] === "pending");
      const newEliminated = batchIds.filter((_, i) => results[i] === "fail");

      const updatedPassedIds = [
        ...state.currentRound!.passedChefIds,
        ...newPassed,
      ];

      const shouldComplete = updatedPassedIds.length >= targetPassCount;

      // 완료 시 미합격 흑수저 전원 탈락 처리
      const finalChefs = shouldComplete
        ? updatedChefs.map((c) => {
            if (
              c.rank === "BLACK" &&
              c.status !== "eliminated" &&
              !updatedPassedIds.includes(c.id)
            ) {
              return {
                ...c,
                status: "eliminated" as const,
                eliminatedRound: currentRound.roundNumber,
              };
            }
            return c;
          })
        : updatedChefs;

      return {
        chefs: finalChefs,
        currentRound: state.currentRound
          ? {
              ...state.currentRound,
              currentJudgingIndex: currentJudgingIndex + batchIds.length,
              passedChefIds: updatedPassedIds,
              pendingChefIds: [
                ...state.currentRound.pendingChefIds,
                ...newPending,
              ],
              eliminatedChefIds: [
                ...state.currentRound.eliminatedChefIds,
                ...newEliminated,
              ],
              status: shouldComplete ? "completed" : state.currentRound.status,
              messageLog: [...state.currentRound.messageLog, ...messages],
            }
          : null,
      };
    });

    return {
      chefs: batch,
      results,
      messages,
    };
  },

  startRound2: () => {
    const { chefs, currentRound } = get();
    // 1라운드가 완료되지 않았으면 실행 불가
    if (
      !currentRound ||
      currentRound.roundNumber !== 1 ||
      currentRound.status !== "completed"
    )
      return;

    // 생존자 필터링
    const aliveBlack = chefs.filter(
      (c) => c.rank === "BLACK" && c.status === "alive"
    );
    const aliveWhite = chefs.filter(
      (c) => c.rank === "WHITE" && c.status === "alive"
    );

    // 랜덤 셔플
    const shuffledBlack = [...aliveBlack].sort(() => Math.random() - 0.5);
    const shuffledWhite = [...aliveWhite].sort(() => Math.random() - 0.5);

    // 1:1 매칭 생성 및 요리(Dish) 준비
    const matches: any[] = []; // Match type import needed, using any for now to avoid circular dependency issues in inline code if not imported

    // 최소 길이만큼 매칭 (남는 인원은 부전승 처리 등 추후 고려, 일단 10vs10 가정)
    const matchCount = Math.min(shuffledBlack.length, shuffledWhite.length);

    // 재료 생성 (10개 유니크)
    const ingredients = [...MAIN_INGREDIENTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, matchCount);

    for (let i = 0; i < matchCount; i++) {
      const mainIngredient = ingredients[i];
      matches.push({
        id: `match-${i + 1}`,
        blackChefId: shuffledBlack[i].id,
        whiteChefId: shuffledWhite[i].id,
        mainIngredient: mainIngredient,
        // 요리 생성 (스탯 기반 + 주재료)
        blackDish: generateDish(shuffledBlack[i], mainIngredient),
        whiteDish: generateDish(shuffledWhite[i], mainIngredient),
        votes: [],
        isTie: false,
        status: "ready",
      });
    }

    const newRound: Round = {
      roundNumber: 2,
      status: "cooking", // 2라운드는 바로 요리(매칭 확인)부터 시작
      matches: matches,
      cookingChefIds: [], // 사용 안함
      judgingQueue: [], // 사용 안함
      currentJudgingIndex: 0,
      passedChefIds: [],
      pendingChefIds: [],
      eliminatedChefIds: [],
      targetPassCount: 10,
      userPickLimit: 0,
      cycleComplete: false,
      messageLog: [
        "⚔️ 라운드 2: 1vs1 흑백 대전 시작!",
        "조별 1:1 매칭이 완료되었습니다.",
      ],
    };

    set({ currentRound: newRound });
  },

  judgeMatch: (matchId: string) => {
    const { currentRound } = get();
    if (
      !currentRound ||
      currentRound.roundNumber !== 2 ||
      !currentRound.matches
    )
      return;

    const matchIndex = currentRound.matches.findIndex((m) => m.id === matchId);
    if (matchIndex === -1) return;

    const match = currentRound.matches[matchIndex];
    if (match.status === "completed" || !match.blackDish || !match.whiteDish)
      return; // 이미 완료되었거나 요리가 없으면 중단

    // 심사 로직
    const { blackDish, whiteDish } = match;

    // Judge P (Taste 70%, Completeness 30%)
    const scoreP_Black =
      blackDish.scores.taste * 0.7 + blackDish.scores.completeness * 0.3;
    const scoreP_White =
      whiteDish.scores.taste * 0.7 + whiteDish.scores.completeness * 0.3;
    const voteP = scoreP_Black >= scoreP_White ? "black" : "white";

    // Judge A (Completeness 40%, Creativity 30%, Taste 30%)
    // 특수 룰: 완성도가 50 미만이면 무조건 탈락 점수 처리 (0점 취급)
    const effectiveCompletenessBlack =
      blackDish.scores.completeness < 50 ? 0 : blackDish.scores.completeness;
    const effectiveCompletenessWhite =
      whiteDish.scores.completeness < 50 ? 0 : whiteDish.scores.completeness;

    const scoreA_Black =
      effectiveCompletenessBlack * 0.4 +
      blackDish.scores.creativity * 0.3 +
      blackDish.scores.taste * 0.3;
    const scoreA_White =
      effectiveCompletenessWhite * 0.4 +
      whiteDish.scores.creativity * 0.3 +
      whiteDish.scores.taste * 0.3;
    const voteA = scoreA_Black >= scoreA_White ? "black" : "white";

    // 결과 처리
    let winnerId: string | undefined;
    let isTie = false;

    const votes = [
      {
        judge: "P" as const,
        pick: voteP === "black" ? match.blackChefId : match.whiteChefId,
        comment: "맛이 중요하쥬.",
      },
      {
        judge: "A" as const,
        pick: voteA === "black" ? match.blackChefId : match.whiteChefId,
        comment: "의도가 잘 보이네요.",
      },
    ];

    if (voteP === voteA) {
      // 만장일치
      winnerId = voteP === "black" ? match.blackChefId : match.whiteChefId;
    } else {
      // 1:1 무승부 (보류) -> 난상토론 로직 (랜덤 승자)
      // 안성재의 의견이 조금 더 반영될 확률? (일단 50:50)
      isTie = true;
      winnerId = Math.random() < 0.5 ? match.blackChefId : match.whiteChefId;
      // 보류여도 승자는 결정해야 다음 진행 가능하므로 winnerId는 설정하되, UI에서 '보류 후 결정' 연출 가능
    }

    // Update Round State
    set((state) => {
      if (!state.currentRound || !state.currentRound.matches)
        return { currentRound: state.currentRound };

      const updatedMatches = [...state.currentRound.matches];
      updatedMatches[matchIndex] = {
        ...match,
        votes,
        winnerId,
        isTie,
        status: "completed",
      };

      const updatedPassedIds = [
        ...state.currentRound.passedChefIds,
        ...(winnerId ? [winnerId] : []),
      ];
      const updatedEliminatedIds = [
        ...state.currentRound.eliminatedChefIds,
        ...(winnerId
          ? winnerId === match.blackChefId
            ? [match.whiteChefId]
            : [match.blackChefId]
          : []),
      ];

      return {
        currentRound: {
          ...state.currentRound,
          matches: updatedMatches,
          passedChefIds: updatedPassedIds,
          eliminatedChefIds: updatedEliminatedIds,
        },
      };
    });
  },

  isRoundComplete: () => {
    const { currentRound } = get();
    return currentRound?.status === "completed";
  },
}));

// Debug hook for testing
if (typeof window !== "undefined") {
  (window as any).chefStore = useChefStore;
}
