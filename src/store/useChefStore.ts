import { create } from "zustand";
import type { Chef, ChefRank } from "../types/chef";
import type { Round, JudgingResult, Round3State } from "../types/round";
import type { Match } from "../types/match";
import { generateJudges } from "../types/judge";
import {
  ROUND_1_TARGET_PASS_COUNT,
  ROUND_1_USER_PICK_LIMIT,
} from "../types/round";
import { generateAllChefs } from "../utils/chef-generator";
import { generateDish, MAIN_INGREDIENTS } from "../utils/dish-generator";
import { judgeChef, sortChefList } from "../utils/round-logic";
import { playRound3MatchAction } from "./round3-actions";

const JUDGING_BATCH_SIZE = 4; // 4명씩 심사
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
  startRound2: (force?: boolean) => void;
  judgeMatch: (matchId: string) => void;
  startRound3: (force?: boolean) => void;
  playRound3Match: () => void;
  setRound3Prediction: (prediction: "BLACK" | "WHITE") => void;
  isRoundComplete: () => boolean;
  autoPickBlackChefs: () => void;
  toggleRound2UserPick: (chefId: string) => void;
  proceedToRound2Reveal: () => void;
  proceedToRound2Summary: () => void;
  playNextRound2Highlight: () => void;
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
      (chef) => chef.rank === "BLACK" && chef.status === "alive",
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
          c.id === chefId ? { ...c, isPlayerPick: false } : c,
        ),
      }));
      return true;
    }

    if (currentPicks.length >= currentRound.userPickLimit) {
      return false;
    }

    set((state) => ({
      chefs: state.chefs.map((c) =>
        c.id === chefId ? { ...c, isPlayerPick: true } : c,
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

  autoPickBlackChefs: () => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "picking") return;

    const currentPicks = chefs.filter((c) => c.isPlayerPick);
    const needToPick = currentRound.userPickLimit - currentPicks.length;

    if (needToPick <= 0) return;

    // 점수 높은 순으로 자동 선택
    const available = chefs
      .filter(
        (c) => c.rank === "BLACK" && c.status === "alive" && !c.isPlayerPick,
      )
      .sort((a, b) => b.stats.proficiency - a.stats.proficiency)
      .slice(0, needToPick);

    set((state) => ({
      chefs: state.chefs.map((c) =>
        available.find((a) => a.id === c.id) ? { ...c, isPlayerPick: true } : c,
      ),
    }));
  },

  toggleRound2UserPick: (chefId: string) => {
    const { currentRound } = get();
    if (
      !currentRound ||
      currentRound.roundNumber !== 2 ||
      !currentRound.round2State ||
      currentRound.round2State.phase !== "picking"
    ) {
      return;
    }

    const { userPicks } = currentRound.round2State;
    const isAlreadyPicked = userPicks.includes(chefId);

    let newUserPicks;
    if (isAlreadyPicked) {
      newUserPicks = userPicks.filter((id) => id !== chefId);
    } else {
      if (userPicks.length >= 2) return; // 최대 2명
      newUserPicks = [...userPicks, chefId];
    }

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            round2State: {
              ...state.currentRound.round2State!,
              userPicks: newUserPicks,
            },
          }
        : null,
    }));
  },

  proceedToRound2Reveal: () => {
    const { currentRound, judgeMatch } = get();
    if (
      !currentRound ||
      currentRound.roundNumber !== 2 ||
      !currentRound.round2State
    )
      return;

    const { matches, round2State } = currentRound;
    if (!matches) return;

    // 1. 모든 매치 심사 진행 (결과 미리 생성)
    matches.forEach((match) => judgeMatch(match.id));

    // 2. 하이라이트 매치 선정 (유저 픽 제외 랜덤 3개)
    const userPickMatchIds = matches
      .filter(
        (m) =>
          round2State.userPicks.includes(m.blackChefId) ||
          round2State.userPicks.includes(m.whiteChefId),
      )
      .map((m) => m.id);

    const otherMatchIds = matches
      .map((m) => m.id)
      .filter((id) => !userPickMatchIds.includes(id))
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const highlightMatches = [...userPickMatchIds, ...otherMatchIds];

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            status: "judging",
            round2State: {
              ...state.currentRound.round2State!,
              phase: "revealing_user", // 시작은 유저 픽부터
              highlightMatches,
              currentRevealIndex: 0,
            },
            messageLog: [
              "🥁 심사가 종료되었습니다.",
              "결과를 공개합니다!",
              `당신의 선택: ${round2State.userPicks.length}명`,
            ],
          }
        : null,
    }));
  },

  playNextRound2Highlight: () => {
    const { currentRound } = get();
    if (
      !currentRound ||
      currentRound.roundNumber !== 2 ||
      !currentRound.round2State
    )
      return;

    const { highlightMatches, currentRevealIndex } = currentRound.round2State;

    if (currentRevealIndex < highlightMatches.length - 1) {
      // 다음 하이라이트로 이동
      set((state) => ({
        currentRound: state.currentRound
          ? {
              ...state.currentRound,
              round2State: {
                ...state.currentRound.round2State!,
                currentRevealIndex: currentRevealIndex + 1,
              },
            }
          : null,
      }));
    } else {
      // 하이라이트 종료 -> 요약 페이지로
      get().proceedToRound2Summary();
    }
  },

  proceedToRound2Summary: () => {
    // Round 2 종료: 1:1 매치 결과 그대로 확정 (부활 없음)
    set((state) => {
      if (!state.currentRound) return {};

      // 팀별 생존자 수 계산
      const blackSurvivors = state.chefs.filter(
        (c) => c.rank === "BLACK" && c.status === "alive",
      ).length;
      const whiteSurvivors = state.chefs.filter(
        (c) => c.rank === "WHITE" && c.status === "alive",
      ).length;

      return {
        currentRound: {
          ...state.currentRound,
          status: "completed",
          round2State: {
            ...state.currentRound.round2State!,
            phase: "summary",
          },
          messageLog: [
            ...state.currentRound.messageLog,
            "🏁 모든 대결이 종료되었습니다.",
            `📊 흑수저 팀 생존: ${blackSurvivors}명`,
            `📊 백수저 팀 생존: ${whiteSurvivors}명`,
            "최종 생존자를 확인하세요.",
          ],
        },
      };
    });
  },

  startRound1Judging: () => {
    const { currentRound } = get();
    if (!currentRound || currentRound.status !== "picking") return;

    const aliveBlackChefs = get().getAliveBlackChefs();
    // 속도 기반 요리 순서로 cookingChefIds 설정
    const cookingOrder = createSpeedWeightedOrder(aliveBlackChefs);

    // 즉시 요리 완료 (첫 배치를 바로 심사 대기열로 이동하여 대기 시간 제거)
    const initialReady = cookingOrder.slice(0, COOKING_BATCH_SIZE);
    const remainingCooking = cookingOrder.slice(COOKING_BATCH_SIZE);

    set((state) => ({
      currentRound: state.currentRound
        ? {
            ...state.currentRound,
            status: "judging",
            cookingChefIds: remainingCooking,
            judgingQueue: initialReady, // 첫 배치 즉시 대기
            currentJudgingIndex: 0,
            cycleComplete: false,
            messageLog: [
              "🍳 라운드 1 심사 시작!",
              `🔥 ${aliveBlackChefs.length}명의 흑수저 쉐프가 동시에 요리를 시작합니다!`,
              ...initialReady.map((id) => {
                const chef = state.chefs.find((c) => c.id === id);
                return `🍽️ ${chef?.nickname} 요리 완료!`;
              }),
            ],
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
      (chef) => `🍽️ ${chef.nickname} 요리 완료!`,
    );

    if (remainingCooking.length === 0) {
      messages.push("✨ 모든 쉐프의 요리가 완료되었습니다!");
    }

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

  // 심사 대기 큐에서 4명씩 심사
  advanceRound1Judging: () => {
    const { currentRound, chefs } = get();
    if (!currentRound || currentRound.status !== "judging") return null;

    const {
      judgingQueue,
      currentJudgingIndex,
      passedChefIds,
      targetPassCount,
      pendingChefIds,
      eliminatedChefIds,
    } = currentRound;

    // 이미 목표 달성 시 완료 처리 (기존 로직 유지) -> 사실 cycle end 로직에서 처리됨
    // 여기서는 혹시 모를 안전장치

    // 100명 전체 심사 확인 (Cooking 끝, Queue 끝)
    // judgingQueue는 모든 cooking이 끝나면 전체 인원이 들어가야 함.
    // 하지만 batch processing이라 currentJudgingIndex가 끝까지 갔는지 확인.
    const isCycleComplete =
      currentJudgingIndex >= judgingQueue.length &&
      currentRound.cookingChefIds.length === 0;

    if (isCycleComplete) {
      // 사이클 종료 처리 로직
      const currentPassCount = passedChefIds.length;
      const currentPendingCount = pendingChefIds.length;
      const totalPotential = currentPassCount + currentPendingCount;

      const remainingSlots = targetPassCount - currentPassCount;

      // =================================================================
      // Case 0: Pass >= 20 (이미 합격자가 목표 이상)
      // =================================================================
      if (currentPassCount >= targetPassCount) {
        // 합격자가 20명 이상이면 초과분 성적순 컷, 보류/탈락 전원 탈락
        const passedChefs = passedChefIds
          .map((id) => chefs.find((c) => c.id === id))
          .filter((c): c is Chef => !!c)
          .sort((a, b) => {
            const sumA = Object.values(a.stats).reduce((acc, v) => acc + v, 0);
            const sumB = Object.values(b.stats).reduce((acc, v) => acc + v, 0);
            return sumB - sumA;
          });

        const finalPassedIds = passedChefs
          .slice(0, targetPassCount)
          .map((c) => c.id);
        const excessPassIds = passedChefs
          .slice(targetPassCount)
          .map((c) => c.id);

        const notifyMessages = [
          `🎯 합격자 ${currentPassCount}명 중 성적순 ${targetPassCount}명 확정`,
        ];
        if (excessPassIds.length > 0) {
          notifyMessages.push(
            `🔻 초과 합격자 ${excessPassIds.length}명 탈락 처리`,
          );
        }
        if (pendingChefIds.length > 0) {
          notifyMessages.push(`❌ 보류자 ${pendingChefIds.length}명 전원 탈락`);
        }

        set((state) => {
          const updatedChefs = state.chefs.map((c) => {
            if (finalPassedIds.includes(c.id)) {
              return { ...c, status: "alive" as const };
            }
            if (excessPassIds.includes(c.id) || pendingChefIds.includes(c.id)) {
              return {
                ...c,
                status: "eliminated" as const,
                eliminatedRound: 1,
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
                  passedChefIds: finalPassedIds,
                  pendingChefIds: [],
                  eliminatedChefIds: [
                    ...state.currentRound.eliminatedChefIds,
                    ...excessPassIds,
                    ...pendingChefIds,
                  ],
                  messageLog: [
                    ...state.currentRound.messageLog,
                    ...notifyMessages,
                    "🏆 라운드 1 완료!",
                  ],
                }
              : null,
          };
        });

        return {
          chefs: [],
          results: [],
          messages: notifyMessages,
        };
      }

      // =================================================================
      // Case 1: Pass + Pending <= 20
      // =================================================================
      if (totalPotential <= targetPassCount) {
        // Pending 전원 합격
        const pendingChefs = pendingChefIds
          .map((id) => chefs.find((c) => c.id === id))
          .filter((c): c is Chef => !!c);

        const newPassedIds = pendingChefs.map((c) => c.id);
        const slotsAfterPending = remainingSlots - newPassedIds.length;

        // 부족분만큼 탈락자 부활 (Case 1-1: Pass + Pending < 20)
        let revivedIds: string[] = [];
        if (slotsAfterPending > 0) {
          const eliminatedChefs = eliminatedChefIds
            .map((id) => chefs.find((c) => c.id === id))
            .filter((c): c is Chef => !!c)
            .sort((a, b) => {
              // Total Stats Descending
              const sumA = Object.values(a.stats).reduce(
                (acc, v) => acc + v,
                0,
              );
              const sumB = Object.values(b.stats).reduce(
                (acc, v) => acc + v,
                0,
              );
              return sumB - sumA;
            });
          revivedIds = eliminatedChefs
            .slice(0, slotsAfterPending)
            .map((c) => c.id);
        }

        const notifyMessages: string[] = [];
        if (newPassedIds.length > 0) {
          notifyMessages.push(`📢 보류자 전원 합격 (${newPassedIds.length}명)`);
        }
        if (revivedIds.length > 0) {
          notifyMessages.push(
            `🔄 부족 인원 충원: 탈락자 ${revivedIds.length}명 부활!`,
          );
        }

        set((state) => {
          const updatedChefs = state.chefs.map((c) => {
            if (newPassedIds.includes(c.id) || revivedIds.includes(c.id)) {
              return { ...c, status: "alive" as const };
            }
            // 나머지는 그대로
            return c;
          });

          // 부활하지 못한 탈락자는 그대로 eliminated 상태 유지 (이미 처리됨)

          return {
            chefs: updatedChefs,
            currentRound: state.currentRound
              ? {
                  ...state.currentRound,
                  status: "completed",
                  passedChefIds: [
                    ...state.currentRound.passedChefIds,
                    ...newPassedIds,
                    ...revivedIds,
                  ],
                  pendingChefIds: [], // Clear pending
                  // Eliminated update: remove revived ones
                  eliminatedChefIds:
                    state.currentRound.eliminatedChefIds.filter(
                      (id) => !revivedIds.includes(id),
                    ),
                  messageLog: [
                    ...state.currentRound.messageLog,
                    ...notifyMessages,
                    "🏆 라운드 1 완료!",
                  ],
                }
              : null,
          };
        });

        return {
          chefs: [], // No implementation of batch return for cycle end logic block
          results: [],
          messages: notifyMessages,
        };
      } else {
        // =================================================================
        // Case 2: Pass + Pending > 20 (and Pass < 20)
        // =================================================================
        // Pending 중에서 성적순으로 remainingSlots 만큼 Pass, 나머지 Fail
        const pendingChefs = pendingChefIds
          .map((id) => chefs.find((c) => c.id === id))
          .filter((c): c is Chef => !!c)
          .sort((a, b) => {
            const sumA = Object.values(a.stats).reduce((acc, v) => acc + v, 0);
            const sumB = Object.values(b.stats).reduce((acc, v) => acc + v, 0);
            return sumB - sumA;
          });

        const passedFromPending = pendingChefs.slice(0, remainingSlots);
        const failedFromPending = pendingChefs.slice(remainingSlots);

        const newPassedIds = passedFromPending.map((c) => c.id);
        const newEliminatedIds = failedFromPending.map((c) => c.id);

        const notifyMessages = [
          `📢 보류자 재심사: 성적순 ${newPassedIds.length}명 합격, ${newEliminatedIds.length}명 탈락`,
        ];

        set((state) => {
          const updatedChefs = state.chefs.map((c) => {
            if (newPassedIds.includes(c.id)) {
              return { ...c, status: "alive" as const };
            }
            if (newEliminatedIds.includes(c.id)) {
              return {
                ...c,
                status: "eliminated" as const,
                eliminatedRound: 1,
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
                  passedChefIds: [
                    ...state.currentRound.passedChefIds,
                    ...newPassedIds,
                  ],
                  pendingChefIds: [],
                  eliminatedChefIds: [
                    ...state.currentRound.eliminatedChefIds,
                    ...newEliminatedIds,
                  ],
                  messageLog: [
                    ...state.currentRound.messageLog,
                    ...notifyMessages,
                    "🏆 라운드 1 완료!",
                  ],
                }
              : null,
          };
        });
        return {
          chefs: [],
          results: [],
          messages: notifyMessages,
        };
      }
    }

    // --- Normal Batch Judging Process --- (기존 로직 유지하되, PassCount 제한 로직은 제거 - Pending으로 보내기만 함)
    // 4명씩 심사
    const batchIds = judgingQueue.slice(
      currentJudgingIndex,
      currentJudgingIndex + JUDGING_BATCH_SIZE,
    );
    const batch = batchIds
      .map((id) => chefs.find((c) => c.id === id))
      .filter((c): c is Chef => c !== undefined);

    if (batch.length === 0) return null;

    // 각 쉐프 판정
    const rawResults = batch.map((chef) => judgeChef(chef));

    // 여기서는 일단 Pass/Pending/Fail 그대로 기록.
    // 어차피 Cycle End에서 최종 수량 조절함.
    // 단, 이미 Target을 채웠으면 Pending으로 보내는게 낫나? -> 아니면 Fail?
    // "재심사를 진행한다" 하려면 일단 Pending으로 쌓아야 함.
    // 하지만 바로 합격시켜도 되면 합격시킴.
    // 100명 다 돌 때까지 Pass가 20명 넘어가면? -> 문제 발생.
    // 따라서, Pass가 20명이 찼다면, 무조건 Pending으로 보내는게 맞음.

    const results: JudgingResult[] = rawResults.map((result) => {
      if (result === "pass") {
        // 이미 합격자가 찼으면 Pending으로 돌림 -> 나중에 성적순 컷트
        if (passedChefIds.length >= targetPassCount) {
          return "pending";
        }
        // 합격자가 안 찼어도, 이번 배치에서 넘치게 되면?
        // state 업데이트 시점에서 체크해야 하나, 여기서 미리 계산하기 복잡함.
        // 단순화를 위해: 일단 Pass로 두되, 나중에 Cycle End에서 Pass > 20 상황은 발생 안하도록 해야 하는데...
        // 아, Pass된 사람은 이미 확정이라 취소하기 어려움.
        // 그러므로 여기서 Pass 제한을 걸어야 함.
      }
      return result;
    });

    // 배치 내에서 Pass 수량 조절
    let currentTotalPass = passedChefIds.length;
    const adjustResults = results.map((r) => {
      if (r === "pass") {
        if (currentTotalPass < targetPassCount) {
          currentTotalPass++;
          return "pass";
        } else {
          return "pending";
        }
      }
      return r;
    });

    const messages = batch.map((chef, i) => {
      const result = adjustResults[i];
      if (result === "pass") return `✅ ${chef.nickname} 통과!`;
      if (result === "pending") return `⏳ ${chef.nickname} 보류`;
      return `❌ ${chef.nickname} 탈락`;
    });

    set((state) => {
      const updatedChefs = state.chefs.map((c) => {
        const idx = batchIds.indexOf(c.id);
        if (idx === -1) return c;

        const result = adjustResults[idx];
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

      const newPassed = batchIds.filter((_, i) => adjustResults[i] === "pass");
      const newPending = batchIds.filter(
        (_, i) => adjustResults[i] === "pending",
      );
      const newEliminated = batchIds.filter(
        (_, i) => adjustResults[i] === "fail",
      );

      // 상태 업데이트만 하고 완료 처리는 Cycle End에서 함 (마지막 배치일 때)
      // 단, 100번째 배치가 끝나는 순간, 위쪽의 isCycleComplete 로직은 다음 틱에서 불리나?
      // currentJudgingIndex를 업데이트하므로 다음 호출 때 isCycleComplete가 true가 됨.
      // 하지만 자동 호출이 아니므로, 여기서 마지막 배치였으면 바로 Cycle End 로직을 태우거나,
      // 아니면 UI/Test에서 한 번 더 호출해줘야 함.
      // 보통 Tick 기반이면 다음 Tick에 됨.
      // 여기서는 Return 구조상 한 번에 하나만 하므로,
      // 마지막 배치 처리 후 -> 다음 호출 시 Cycle End 로직 실행됨.

      return {
        chefs: updatedChefs,
        currentRound: state.currentRound
          ? {
              ...state.currentRound,
              currentJudgingIndex: currentJudgingIndex + batchIds.length,
              passedChefIds: [
                ...state.currentRound.passedChefIds,
                ...newPassed,
              ],
              pendingChefIds: [
                ...state.currentRound.pendingChefIds,
                ...newPending,
              ],
              eliminatedChefIds: [
                ...state.currentRound.eliminatedChefIds,
                ...newEliminated,
              ],
              messageLog: [...state.currentRound.messageLog, ...messages],
            }
          : null,
      };
    });

    return {
      chefs: batch,
      results: adjustResults,
      messages,
    };
  },

  startRound2: (force?: boolean) => {
    const { chefs, currentRound } = get();
    // 1라운드가 완료되지 않았으면 실행 불가
    if (
      !force &&
      (!currentRound ||
        currentRound.roundNumber !== 1 ||
        currentRound.status !== "completed")
    )
      return;

    // 생존자 필터링
    const aliveBlack = chefs.filter(
      (c) => c.rank === "BLACK" && c.status === "alive",
    );
    const aliveWhite = chefs.filter(
      (c) => c.rank === "WHITE" && c.status === "alive",
    );

    // 랜덤 셔플
    const shuffledBlack = [...aliveBlack].sort(() => Math.random() - 0.5);
    const shuffledWhite = [...aliveWhite].sort(() => Math.random() - 0.5);

    // 1:1 매칭 생성 및 요리(Dish) 준비
    const matches: Match[] = []; // Match type import needed, using any for now to avoid circular dependency issues in inline code if not imported

    // 최소 길이만큼 매칭 (남는 인원은 부전승 처리 등 추후 고려, 일단 10vs10 가정)
    const matchCount = Math.min(shuffledBlack.length, shuffledWhite.length);

    // 재료 생성 (10개 유니크)
    const ingredients = [...MAIN_INGREDIENTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, matchCount)
      .map((i) => i.name);

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
      status: "picking", // [FIX] "cooking" -> "picking"으로 변경
      matches: matches,
      cookingChefIds: [],
      judgingQueue: [],
      currentJudgingIndex: 0,
      passedChefIds: [],
      pendingChefIds: [],
      eliminatedChefIds: [],
      targetPassCount: 10,
      userPickLimit: 2, // [FIX] 0 -> 2
      cycleComplete: false,
      round2State: {
        phase: "picking",
        userPicks: [],
        highlightMatches: [],
        currentRevealIndex: 0,
      },
      messageLog: [
        "⚔️ 라운드 2: 1vs1 흑백 대전 시작!",
        "승리할 쉐프 2명을 예측해보세요!",
      ],
    };

    // 생존한 흑수저 쉐프들에게 스탯 1개 추가 공개
    const updatedChefs = chefs.map((chef) => {
      if (chef.rank === "BLACK" && chef.status === "alive") {
        const allStats: (keyof import("../types/chef").ChefStats)[] = [
          "proficiency",
          "creativity",
          "taste",
          "mental",
          "speed",
        ];
        const unrevealed = allStats.filter(
          (s) => !chef.revealedStats.includes(s),
        );
        if (unrevealed.length > 0) {
          const nextStat =
            unrevealed[Math.floor(Math.random() * unrevealed.length)];
          return { ...chef, revealedStats: [...chef.revealedStats, nextStat] };
        }
      }
      return chef;
    });

    set({ chefs: updatedChefs, currentRound: newRound });
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

      const loserId = winnerId
        ? winnerId === match.blackChefId
          ? match.whiteChefId
          : match.blackChefId
        : undefined;

      const updatedPassedIds = [
        ...state.currentRound.passedChefIds,
        ...(winnerId ? [winnerId] : []),
      ];
      const updatedEliminatedIds = [
        ...state.currentRound.eliminatedChefIds,
        ...(loserId ? [loserId] : []),
      ];

      const allMatchesCompleted = updatedMatches.every(
        (m) => m.status === "completed",
      );

      // 패자 쉐프 상태 업데이트
      const updatedChefs = loserId
        ? state.chefs.map((c) =>
            c.id === loserId
              ? {
                  ...c,
                  status: "eliminated" as const,
                  eliminatedRound: state.currentRound!.roundNumber,
                }
              : c,
          )
        : state.chefs;

      return {
        chefs: updatedChefs,
        currentRound: {
          ...state.currentRound,
          matches: updatedMatches,
          passedChefIds: updatedPassedIds,
          eliminatedChefIds: updatedEliminatedIds,
          status: allMatchesCompleted ? "completed" : state.currentRound.status,
        },
      };
    });
  },

  startRound3: (force?: boolean) => {
    const { currentRound } = get();
    if (
      !force &&
      (!currentRound ||
        currentRound.roundNumber !== 2 ||
        currentRound.status !== "completed")
    )
      return;

    // 100인의 심사위원 생성
    const judges = generateJudges(100);

    const round3State: Round3State = {
      matches: [], // 매치는 playRound3Match 호출 시 생성됨 (혹은 미리 생성 가능)
      currentMatchIndex: 0,
      judges,
      blackTeamScore: 0,
      whiteTeamScore: 0,
      userPrediction: null,
    };

    const newRound: Round = {
      roundNumber: 3,
      status: "picking", // 예측 단계
      round3State,
      cookingChefIds: [],
      judgingQueue: [],
      currentJudgingIndex: 0,
      passedChefIds: [],
      pendingChefIds: [],
      eliminatedChefIds: [],
      targetPassCount: 0,
      userPickLimit: 0,
      cycleComplete: false,
      messageLog: [
        "⚔️ 라운드 3: 흑백 팀전 (재료의 방) 시작!",
        "승리할 것으로 예상되는 팀을 선택해주세요.",
      ],
    };

    // 생존한 흑수저 쉐프들에게 스탯 1개 추가 공개
    const { chefs: currentChefs } = get();
    const updatedChefs = currentChefs.map((chef) => {
      if (chef.rank === "BLACK" && chef.status === "alive") {
        const allStats: (keyof import("../types/chef").ChefStats)[] = [
          "proficiency",
          "creativity",
          "taste",
          "mental",
          "speed",
        ];
        const unrevealed = allStats.filter(
          (s) => !chef.revealedStats.includes(s),
        );
        if (unrevealed.length > 0) {
          const nextStat =
            unrevealed[Math.floor(Math.random() * unrevealed.length)];
          return { ...chef, revealedStats: [...chef.revealedStats, nextStat] };
        }
      }
      return chef;
    });

    set({ chefs: updatedChefs, currentRound: newRound });
  },

  setRound3Prediction: (prediction: "BLACK" | "WHITE") => {
    set((state) => {
      if (!state.currentRound || state.currentRound.roundNumber !== 3)
        return { currentRound: state.currentRound };

      return {
        currentRound: {
          ...state.currentRound,
          round3State: state.currentRound.round3State
            ? {
                ...state.currentRound.round3State,
                userPrediction: prediction,
              }
            : undefined,
        },
      };
    });
  },

  playRound3Match: () => {
    const { chefs, currentRound } = get();
    if (
      !currentRound ||
      currentRound.roundNumber !== 3 ||
      !currentRound.round3State
    )
      return;

    const { round3State } = currentRound;
    const matchIndex = round3State.currentMatchIndex;

    const result = playRound3MatchAction(chefs, round3State, matchIndex);
    if (!result) return;

    set((state) => {
      if (!state.currentRound || !state.currentRound.round3State)
        return { currentRound: state.currentRound };

      // 매치 기록 생성
      const newMatch = {
        id: `r3-match-${matchIndex}`,
        blackChefId: "team-black",
        whiteChefId: "team-white",
        blackDish: result.blackDish,
        whiteDish: result.whiteDish,
        mainIngredient: result.mainIngredient,
        votes: [], // 상세 100개 투표는 생략하거나 요약만 저장
        winnerId: result.winnerId,
        isTie: false,
        status: "completed" as const,
        judgesSnapshot: result.updatedJudges, // 심사위원 스냅샷 저장
      };

      const newBlackTeamScore =
        state.currentRound.round3State.blackTeamScore + result.roundBlackScore;
      const newWhiteTeamScore =
        state.currentRound.round3State.whiteTeamScore + result.roundWhiteScore;

      const isLastMatch = matchIndex === 2;
      const messageLog = [...state.currentRound.messageLog];

      messageLog.push(
        `🥊 매치 ${
          matchIndex + 1
        } 종료! (흑: ${result.blackVotes}표, 백: ${result.whiteVotes}표)`,
      );

      if (isLastMatch) {
        const finalWinner =
          newBlackTeamScore >= newWhiteTeamScore ? "BLACK" : "WHITE";
        messageLog.push(
          `🏆 최종 승리: ${
            finalWinner === "BLACK" ? "흑수저 팀" : "백수저 팀"
          }!`,
        );
      }

      return {
        currentRound: {
          ...state.currentRound,
          status: isLastMatch ? "completed" : "cooking",
          messageLog,
          round3State: {
            ...state.currentRound.round3State,
            matches: [...state.currentRound.round3State.matches, newMatch],
            currentMatchIndex: matchIndex + 1,
            judges: result.nextJudges,
            blackTeamScore: newBlackTeamScore,
            whiteTeamScore: newWhiteTeamScore,
          },
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).chefStore = useChefStore;
}
