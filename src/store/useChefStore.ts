import { create } from "zustand";
import type { Chef, ChefRank } from "../types/chef";
import type { Round } from "../types/round";
import {
  ROUND_1_TARGET_PASS_COUNT,
  ROUND_1_USER_PICK_LIMIT,
} from "../types/round";
import { generateAllChefs } from "../utils/chef-generator";
import {
  createSpeedWeightedQueue,
  judgeChef,
  sortChefList,
} from "../utils/round-logic";

interface ChefStore {
  chefs: Chef[];
  currentRound: Round | null;

  // 게임 초기화 (+ 라운드 시작)
  initializeGame: () => void;

  // 쉐프 조회
  getChefsByRank: (rank: ChefRank) => Chef[];
  getSortedChefs: () => Chef[];
  getAliveBlackChefs: () => Chef[];
  getUserPicks: () => Chef[];

  // 유저 픽
  toggleUserPick: (chefId: string) => boolean;
  canPickMore: () => boolean;

  // 라운드 관리
  startJudging: () => void;
  advanceJudging: () => {
    chef: Chef;
    passed: boolean;
    message: string;
  } | null;
  isRoundComplete: () => boolean;
}

export const useChefStore = create<ChefStore>((set, get) => ({
  chefs: [],
  currentRound: null,

  initializeGame: () => {
    const newChefs = generateAllChefs();
    // 게임 시작 시 Round 1 자동 시작 (picking 상태)
    const newRound: Round = {
      roundNumber: 1,
      status: "picking",
      judgingQueue: [],
      currentJudgingIndex: -1,
      currentStep: "cooking",
      passedChefIds: [],
      eliminatedChefIds: [],
      targetPassCount: ROUND_1_TARGET_PASS_COUNT,
      userPickLimit: ROUND_1_USER_PICK_LIMIT,
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

    // 이미 픽된 경우 해제
    if (isCurrentlyPicked) {
      set((state) => ({
        chefs: state.chefs.map((c) =>
          c.id === chefId ? { ...c, isPlayerPick: false } : c
        ),
      }));
      return true;
    }

    // 픽 제한 확인
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

  startJudging: () => {
    const { currentRound } = get();
    if (!currentRound || currentRound.status !== "picking") return;

    const aliveBlackChefs = get().getAliveBlackChefs();
    const queue = createSpeedWeightedQueue(aliveBlackChefs);

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            status: "judging",
            judgingQueue: queue,
            currentJudgingIndex: 0,
            currentStep: "judging",
          }
        : null,
    }));
  },

  advanceJudging: () => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "judging") return null;

    const { judgingQueue, currentJudgingIndex, passedChefIds } = currentRound;

    // 통과 목표 달성 시 종료
    if (passedChefIds.length >= currentRound.targetPassCount) {
      set((state) => ({
        currentRound: state.currentRound
          ? { ...state.currentRound, status: "completed" }
          : null,
      }));
      return null;
    }

    // 큐 끝까지 갔는데 목표 미달 시 재큐잉
    if (currentJudgingIndex >= judgingQueue.length) {
      const remaining = chefs.filter(
        (c) =>
          c.rank === "BLACK" &&
          c.status === "alive" &&
          !passedChefIds.includes(c.id)
      );
      if (remaining.length === 0) {
        set((state) => ({
          currentRound: state.currentRound
            ? { ...state.currentRound, status: "completed" }
            : null,
        }));
        return null;
      }
      const newQueue = createSpeedWeightedQueue(remaining);
      set((state) => ({
        currentRound: state.currentRound
          ? {
              ...state.currentRound,
              judgingQueue: newQueue,
              currentJudgingIndex: 0,
            }
          : null,
      }));
      return get().advanceJudging();
    }

    const chefId = judgingQueue[currentJudgingIndex];
    const chef = chefs.find((c) => c.id === chefId);
    if (!chef) return null;

    // 직접 채점 진행
    const passed = judgeChef(chef);

    set((state) => {
      const updatedChefs = state.chefs.map((c) => {
        if (c.id === chefId && !passed) {
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
              currentJudgingIndex: currentJudgingIndex + 1,
              passedChefIds: passed
                ? [...state.currentRound.passedChefIds, chefId]
                : state.currentRound.passedChefIds,
              eliminatedChefIds: passed
                ? state.currentRound.eliminatedChefIds
                : [...state.currentRound.eliminatedChefIds, chefId],
            }
          : null,
      };
    });

    return {
      chef,
      passed,
      message: passed ? `${chef.nickname} 통과!` : `${chef.nickname} 탈락...`,
    };
  },

  isRoundComplete: () => {
    const { currentRound } = get();
    return currentRound?.status === "completed";
  },
}));
