import { describe, it, expect } from "vitest";
import {
  createSpeedWeightedOrder,
  autoPickBlackChefsAction,
  startRound1JudgingAction,
  processPendingChefsAction,
  processEliminatedChefsAction,
} from "./round1-actions";
import type { Chef } from "../types/chef";
import type { Round } from "../types/round";

// 테스트용 목 쉐프 생성
const createMockChef = (id: string, overrides: Partial<Chef> = {}): Chef => ({
  id,
  name: "테스트 쉐프",
  nickname: `테스트 ${id}`,
  rank: "BLACK",
  stats: {
    proficiency: 80,
    creativity: 75,
    taste: 85,
    mental: 70,
    speed: 65,
  },
  revealedStats: ["taste"],
  cuisine: "KOREAN",
  specialty: "비빔밥",
  bio: "테스트용 쉐프",
  status: "alive",
  ...overrides,
});

// 테스트용 목 라운드 생성
const createMockRound = (overrides: Partial<Round> = {}): Round => ({
  roundNumber: 1,
  status: "picking",
  cookingChefIds: [],
  judgingQueue: [],
  currentJudgingIndex: 0,
  passedChefIds: [],
  pendingChefIds: [],
  eliminatedChefIds: [],
  targetPassCount: 20,
  userPickLimit: 2,
  cycleComplete: false,
  messageLog: [],
  ...overrides,
});

describe("round1-actions", () => {
  describe("createSpeedWeightedOrder", () => {
    it("쉐프 ID 배열을 반환해야 한다", () => {
      const chefs = [
        createMockChef("chef1", {
          stats: {
            proficiency: 80,
            creativity: 75,
            taste: 85,
            mental: 70,
            speed: 90,
          },
        }),
        createMockChef("chef2", {
          stats: {
            proficiency: 80,
            creativity: 75,
            taste: 85,
            mental: 70,
            speed: 50,
          },
        }),
      ];

      const order = createSpeedWeightedOrder(chefs);
      expect(order).toHaveLength(2);
      expect(order).toContain("chef1");
      expect(order).toContain("chef2");
    });
  });

  describe("autoPickBlackChefsAction", () => {
    it("picking 상태가 아니면 null을 반환해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round = createMockRound({ status: "judging" });

      const result = autoPickBlackChefsAction(chefs, round);
      expect(result).toBeNull();
    });

    it("선택할 쉐프가 있으면 selectedIds를 반환해야 한다", () => {
      const chefs = [
        createMockChef("chef1"),
        createMockChef("chef2"),
        createMockChef("chef3"),
      ];
      const round = createMockRound({ userPickLimit: 2 });

      const result = autoPickBlackChefsAction(chefs, round);
      expect(result).not.toBeNull();
      expect(result?.selectedIds).toHaveLength(2);
    });
  });

  describe("startRound1JudgingAction", () => {
    it("picking 상태가 아니면 null을 반환해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round = createMockRound({ status: "judging" });

      const result = startRound1JudgingAction(chefs, round);
      expect(result).toBeNull();
    });

    it("심사 시작 시 cookingChefIds와 judgingQueue를 반환해야 한다", () => {
      const chefs = Array.from({ length: 10 }, (_, i) =>
        createMockChef(`chef${i}`)
      );
      const round = createMockRound();

      const result = startRound1JudgingAction(chefs, round);
      expect(result).not.toBeNull();
      expect(result?.judgingQueue).toHaveLength(4); // 첫 배치
      expect(result?.cookingChefIds).toHaveLength(6); // 나머지
      expect(result?.messageLog.length).toBeGreaterThan(0);
    });
  });

  describe("processPendingChefsAction", () => {
    it("보류자 중 총점 순으로 합격자를 선발해야 한다", () => {
      const pendingChefs = [
        createMockChef("low", {
          stats: {
            proficiency: 50,
            creativity: 50,
            taste: 50,
            mental: 50,
            speed: 50,
          },
        }),
        createMockChef("high", {
          stats: {
            proficiency: 90,
            creativity: 90,
            taste: 90,
            mental: 90,
            speed: 90,
          },
        }),
      ];
      const pendingIds = pendingChefs.map((c) => c.id);

      const result = processPendingChefsAction(pendingChefs, pendingIds, 1);

      expect(result.chefsToPass).toHaveLength(1);
      expect(result.chefsToPass[0].id).toBe("high");
      expect(result.chefsToEliminate).toHaveLength(1);
    });
  });

  describe("processEliminatedChefsAction", () => {
    it("탈락자 중 총점 순으로 부활자를 선발해야 한다", () => {
      const eliminatedChefs = [
        createMockChef("low", {
          status: "eliminated",
          stats: {
            proficiency: 50,
            creativity: 50,
            taste: 50,
            mental: 50,
            speed: 50,
          },
        }),
        createMockChef("high", {
          status: "eliminated",
          stats: {
            proficiency: 90,
            creativity: 90,
            taste: 90,
            mental: 90,
            speed: 90,
          },
        }),
      ];
      const eliminatedIds = eliminatedChefs.map((c) => c.id);

      const result = processEliminatedChefsAction(
        eliminatedChefs,
        eliminatedIds,
        1
      );

      expect(result.chefsToRevive).toHaveLength(1);
      expect(result.chefsToRevive[0].id).toBe("high");
    });
  });
});
