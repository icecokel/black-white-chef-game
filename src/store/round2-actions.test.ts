import { describe, it, expect } from "vitest";
import {
  revealAdditionalStat,
  createRound2Matches,
  startRound2Action,
  judgeMatchLogic,
} from "./round2-actions";
import type { Chef } from "../types/chef";
import type { Round } from "../types/round";
import type { Match } from "../types/match";

// 테스트용 목 쉐프 생성
const createMockChef = (
  id: string,
  rank: "BLACK" | "WHITE" = "BLACK",
  overrides: Partial<Chef> = {}
): Chef => ({
  id,
  name: "테스트 쉐프",
  nickname: `테스트 ${id}`,
  rank,
  stats: {
    proficiency: 80,
    creativity: 75,
    taste: 85,
    mental: 70,
    speed: 65,
  },
  revealedStats: ["taste"],
  cuisine: "KOREAN",
  specialties: ["KOREAN"],
  bio: "테스트용 쉐프",
  status: "alive",
  ...overrides,
});

describe("round2-actions", () => {
  describe("revealAdditionalStat", () => {
    it("흑수저 생존자에게 스탯을 추가 공개해야 한다", () => {
      const chef = createMockChef("chef1", "BLACK", {
        revealedStats: ["taste"],
      });

      const updated = revealAdditionalStat(chef);
      expect(updated.revealedStats.length).toBe(2);
    });

    it("백수저는 변경하지 않아야 한다", () => {
      const chef = createMockChef("chef1", "WHITE", {
        revealedStats: [
          "taste",
          "creativity",
          "proficiency",
          "mental",
          "speed",
        ],
      });

      const updated = revealAdditionalStat(chef);
      expect(updated).toBe(chef);
    });

    it("탈락자는 변경하지 않아야 한다", () => {
      const chef = createMockChef("chef1", "BLACK", {
        status: "eliminated",
        revealedStats: ["taste"],
      });

      const updated = revealAdditionalStat(chef);
      expect(updated).toBe(chef);
    });
  });

  describe("createRound2Matches", () => {
    it("흑백 매칭을 생성해야 한다", () => {
      const blackChefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("b2", "BLACK"),
      ];
      const whiteChefs = [
        createMockChef("w1", "WHITE"),
        createMockChef("w2", "WHITE"),
      ];

      const matches = createRound2Matches(blackChefs, whiteChefs);

      expect(matches).toHaveLength(2);
      expect(matches[0].blackChefId).toBeDefined();
      expect(matches[0].whiteChefId).toBeDefined();
      expect(matches[0].blackDish).toBeDefined();
      expect(matches[0].whiteDish).toBeDefined();
    });

    it("인원수가 맞지 않으면 더 적은 쪽에 맞춰 매칭하고 남는 인원은 제외해야 한다", () => {
      const blackChefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("b2", "BLACK"),
        createMockChef("b3", "BLACK"),
      ];
      const whiteChefs = [createMockChef("w1", "WHITE")];

      const matches = createRound2Matches(blackChefs, whiteChefs);
      expect(matches).toHaveLength(1);
    });

    it("한쪽 진영이 없으면 매칭이 생성되지 않아야 한다", () => {
      const matches = createRound2Matches([], [createMockChef("w1")]);
      expect(matches).toHaveLength(0);
    });
  });

  describe("startRound2Action", () => {
    it("라운드 1 완료 상태가 아니면 null을 반환해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round: Round = {
        roundNumber: 1,
        status: "judging", // 완료가 아님
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
      };

      const result = startRound2Action(chefs, round);
      expect(result).toBeNull();
    });
  });

  describe("judgeMatchLogic", () => {
    it("완료된 매치는 null을 반환해야 한다", () => {
      const match: Match = {
        id: "match-1",
        blackChefId: "b1",
        whiteChefId: "w1",
        mainIngredient: "트러플",
        votes: [],
        isTie: false,
        status: "completed",
      };

      const result = judgeMatchLogic(match);
      expect(result).toBeNull();
    });

    it("유효한 매치는 심사 결과를 반환해야 한다", () => {
      const match: Match = {
        id: "match-1",
        blackChefId: "b1",
        whiteChefId: "w1",
        mainIngredient: "트러플",
        blackDish: {
          id: "dish-b1",
          chefId: "b1",
          name: "트러플 파스타",
          description: "맛있음",
          scores: { taste: 85, creativity: 80, completeness: 90 },
          tags: ["훌륭함"],
        },
        whiteDish: {
          id: "dish-w1",
          chefId: "w1",
          name: "트러플 리조또",
          description: "훌륭함",
          scores: { taste: 80, creativity: 85, completeness: 85 },
          tags: ["창의적"],
        },
        votes: [],
        isTie: false,
        status: "ready",
      };

      const result = judgeMatchLogic(match);
      expect(result).not.toBeNull();
      expect(result?.winnerId).toBeDefined();
      expect(result?.loserId).toBeDefined();
      expect(result?.votes).toHaveLength(2);
    });

    it("투표가 1:1로 갈리면 isTie가 true여야 한다", () => {
      // P: 흑(맛 승), A: 백(완성도 승) 유도
      const blackDish = {
        id: "b-dish",
        chefId: "b1",
        name: "B",
        description: "",
        tags: [],
        scores: { taste: 100, completeness: 0, creativity: 0 },
      };
      const whiteDish = {
        id: "w-dish",
        chefId: "w1",
        name: "W",
        description: "",
        tags: [],
        scores: { taste: 0, completeness: 100, creativity: 100 },
      };

      const match: Match = {
        id: "m1",
        blackChefId: "b1",
        whiteChefId: "w1",
        mainIngredient: "Test",
        blackDish,
        whiteDish,
        votes: [],
        isTie: false,
        status: "ready",
      };

      const result = judgeMatchLogic(match);

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(true);
      expect(result?.votes[0].pick).not.toBe(result?.votes[1].pick);
    });
  });
});
