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
  overrides: Partial<Chef> = {},
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

// 심사위원 점수 계산 헬퍼 (테스트 검증용)
const calculateJudgeP = (
  taste: number,
  completeness: number,
  creativity: number,
) => taste * 0.6 + completeness * 0.3 + creativity * 0.1;

const calculateJudgeA = (
  taste: number,
  completeness: number,
  creativity: number,
) => completeness * 0.5 + creativity * 0.25 + taste * 0.25;

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
  });

  describe("startRound2Action", () => {
    it("라운드 1 완료 상태가 아니면 null을 반환해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round: Round = {
        roundNumber: 1,
        status: "judging",
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

  describe("judgeMatchLogic - 심사위원별 점수 검증", () => {
    // Case 1: 흑 압도적 승리 (2:0)
    it("Case 1: 흑(90/80/70) vs 백(60/50/40) -> 흑 2:0 승리", () => {
      const blackDish = {
        id: "b-dish",
        chefId: "b1",
        name: "B",
        description: "",
        tags: [],
        scores: { taste: 90, completeness: 80, creativity: 70 },
      };
      const whiteDish = {
        id: "w-dish",
        chefId: "w1",
        name: "W",
        description: "",
        tags: [],
        scores: { taste: 60, completeness: 50, creativity: 40 },
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

      const pBlack = calculateJudgeP(90, 80, 70);
      const pWhite = calculateJudgeP(60, 50, 40);
      const aBlack = calculateJudgeA(90, 80, 70);
      const aWhite = calculateJudgeA(60, 50, 40);

      console.log(`\n[Case 1] 흑(90/80/70) vs 백(60/50/40)`);
      console.log(`P점수: 흑 ${pBlack}점 vs 백 ${pWhite}점`);
      console.log(`A점수: 흑 ${aBlack}점 vs 백 ${aWhite}점`);
      console.log(
        `결과: ${result?.isTie ? "무승부" : result?.winnerId === "b1" ? "흑 승" : "백 승"}`,
      );

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(false);
      expect(result?.winnerId).toBe("b1");
    });

    // Case 2: 백 압도적 승리 (0:2)
    it("Case 2: 흑(50/40/30) vs 백(80/90/85) -> 백 2:0 승리", () => {
      const blackDish = {
        id: "b-dish",
        chefId: "b1",
        name: "B",
        description: "",
        tags: [],
        scores: { taste: 50, completeness: 40, creativity: 30 },
      };
      const whiteDish = {
        id: "w-dish",
        chefId: "w1",
        name: "W",
        description: "",
        tags: [],
        scores: { taste: 80, completeness: 90, creativity: 85 },
      };

      const match: Match = {
        id: "m2",
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

      const pBlack = calculateJudgeP(50, 40, 30);
      const pWhite = calculateJudgeP(80, 90, 85);
      const aBlack = calculateJudgeA(50, 40, 30);
      const aWhite = calculateJudgeA(80, 90, 85);

      console.log(`\n[Case 2] 흑(50/40/30) vs 백(80/90/85)`);
      console.log(`P점수: 흑 ${pBlack}점 vs 백 ${pWhite}점`);
      console.log(`A점수: 흑 ${aBlack}점 vs 백 ${aWhite}점`);
      console.log(
        `결과: ${result?.isTie ? "무승부" : result?.winnerId === "b1" ? "흑 승" : "백 승"}`,
      );

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(false);
      expect(result?.winnerId).toBe("w1");
    });

    // Case 3: 무승부 (P: 흑, A: 백)
    it("Case 3: 흑(90/50/30) vs 백(60/90/80) -> 1:1 무승부", () => {
      const blackDish = {
        id: "b-dish",
        chefId: "b1",
        name: "B",
        description: "",
        tags: [],
        scores: { taste: 90, completeness: 50, creativity: 30 },
      };
      const whiteDish = {
        id: "w-dish",
        chefId: "w1",
        name: "W",
        description: "",
        tags: [],
        scores: { taste: 60, completeness: 90, creativity: 80 },
      };

      const match: Match = {
        id: "m3",
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

      const pBlack = calculateJudgeP(90, 50, 30);
      const pWhite = calculateJudgeP(60, 90, 80);
      const aBlack = calculateJudgeA(90, 50, 30);
      const aWhite = calculateJudgeA(60, 90, 80);

      console.log(`\n[Case 3] 흑(90/50/30) vs 백(60/90/80)`);
      console.log(`P점수: 흑 ${pBlack}점 vs 백 ${pWhite}점`);
      console.log(`A점수: 흑 ${aBlack}점 vs 백 ${aWhite}점`);
      console.log(
        `결과: ${result?.isTie ? "1:1 무승부 (랜덤)" : result?.winnerId === "b1" ? "흑 승" : "백 승"}`,
      );

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(true);
    });

    // Case 4: 동점 (>= 처리로 흑 승)
    it("Case 4: 흑(70/70/70) vs 백(70/70/70) -> 동점 (흑 >= 우선)", () => {
      const blackDish = {
        id: "b-dish",
        chefId: "b1",
        name: "B",
        description: "",
        tags: [],
        scores: { taste: 70, completeness: 70, creativity: 70 },
      };
      const whiteDish = {
        id: "w-dish",
        chefId: "w1",
        name: "W",
        description: "",
        tags: [],
        scores: { taste: 70, completeness: 70, creativity: 70 },
      };

      const match: Match = {
        id: "m4",
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

      const pBlack = calculateJudgeP(70, 70, 70);
      const pWhite = calculateJudgeP(70, 70, 70);
      const aBlack = calculateJudgeA(70, 70, 70);
      const aWhite = calculateJudgeA(70, 70, 70);

      console.log(`\n[Case 4] 흑(70/70/70) vs 백(70/70/70)`);
      console.log(`P점수: 흑 ${pBlack}점 vs 백 ${pWhite}점 (동점)`);
      console.log(`A점수: 흑 ${aBlack}점 vs 백 ${aWhite}점 (동점)`);
      console.log(`결과: 흑 >= 우선으로 흑 승`);

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(false);
      expect(result?.winnerId).toBe("b1");
    });

    // Case 5: 극단적 케이스 (맛 100 vs 완성도+창의 100)
    it("Case 5: 흑(100/0/0) vs 백(0/100/100) -> 1:1 무승부", () => {
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
        id: "m5",
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

      const pBlack = calculateJudgeP(100, 0, 0);
      const pWhite = calculateJudgeP(0, 100, 100);
      const aBlack = calculateJudgeA(100, 0, 0);
      const aWhite = calculateJudgeA(0, 100, 100);

      console.log(`\n[Case 5] 흑(100/0/0) vs 백(0/100/100)`);
      console.log(`P점수: 흑 ${pBlack}점 vs 백 ${pWhite}점`);
      console.log(`A점수: 흑 ${aBlack}점 vs 백 ${aWhite}점`);
      console.log(
        `결과: ${result?.isTie ? "1:1 무승부 (랜덤)" : result?.winnerId === "b1" ? "흑 승" : "백 승"}`,
      );

      expect(result).not.toBeNull();
      expect(result?.isTie).toBe(true);
    });

    // 완료된 매치 테스트
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
  });

  describe("Boost Logic & Round End Simulation", () => {
    // 1. [Extreme] 1명 생존 시: 100% (2배) 부스트 [Max Cap 적용]
    it("[Extreme] 흑수저 1명 생존 시 점수가 2배(100% 부스트, Max Cap)가 되어야 한다", () => {
      // 100점 -> 200점 (1.4 - 0.1 = 1.3 => Cap 1.0)
      const match = createTestMatch(100, 100);
      const result = judgeMatchLogic(match, 1, 20); // 흑 1명 (100%), 백 20명 (0%)

      // 흑: 100 * 2.0 = 200
      // 백: 100 * 1 = 100
      // 예상: 흑 승리
      expect(result?.winnerId).toBe("b1");
      expect(result?.votes[0].pick).toBe("b1"); // Judge P
      expect(result?.votes[1].pick).toBe("b1"); // Judge A
      expect(result?.blackBoost).toBeCloseTo(1.0); // 100% (Capped)
    });

    // 2. [Middle] 5명 생존 시: 90% (1.9배) 부스트
    it("[Middle] 흑수저 5명 생존 시 점수가 1.9배(90% 부스트)가 되어야 한다", () => {
      // 흑 100 -> 190
      // 백 150 -> 150
      const match = createTestMatch(100, 150);
      const result = judgeMatchLogic(match, 5, 20); // 흑 5명 (90%)

      // 흑: 100 * 1.9 = 190
      // 백: 150 * 1.0 = 150
      // 예상: 흑 승리
      expect(result?.winnerId).toBe("b1");
      expect(result?.blackBoost).toBeCloseTo(0.9);
    });

    // 3. [Boundary] 9명 생존 시: 50% (1.5배) 부스트
    it("[Boundary] 흑수저 9명 생존 시 점수가 1.5배(50% 부스트)가 되어야 한다", () => {
      // 흑 100 -> 150
      // 백 110 -> 110
      const match = createTestMatch(100, 110);
      const result = judgeMatchLogic(match, 9, 20); // 흑 9명 (50%)

      // 흑: 100 * 1.5 = 150
      // 백: 110 * 1.0 = 110
      // 예상: 흑 승리
      expect(result?.winnerId).toBe("b1");
      expect(result?.blackBoost).toBeCloseTo(0.5);
    });

    // 4. [No Boost] 10명 생존 시: 0% 부스트
    it("[No Boost] 흑수저 10명 생존 시 부스트가 없어야 한다", () => {
      // 흑 100 -> 100
      // 백 110 -> 110
      const match = createTestMatch(100, 110);
      const result = judgeMatchLogic(match, 10, 20); // 흑 10명 (0%)

      // 흑: 100
      // 백: 110
      // 예상: 백 승리
      expect(result?.winnerId).toBe("w1");
      expect(result?.blackBoost).toBeUndefined();
    });

    // 5. [Effect] 부스트로 인한 승패 역전
    it("[Effect] 부스트로 인해 패배할 매치를 승리해야 한다", () => {
      // 흑 80 vs 백 100 (원래 패배)
      // 흑 3명 생존 (80% 부스트 -> 1.8배)
      const match = createTestMatch(80, 100);
      const result = judgeMatchLogic(match, 3, 20);

      // 흑: 80 * 1.8 = 144
      // 백: 100
      // 예상: 흑 승리 (역전)
      expect(result?.winnerId).toBe("b1");
    });

    // 6. [Outcome] 라운드 종료 시 생존자 수 검증
    it("[Outcome] 20경기 후 양 팀 생존자가 대부분 9명 이상이어야 한다 (부스트 효과)", () => {
      const simulations = 100;
      let bothTeamsAbove9 = 0;

      for (let sim = 0; sim < simulations; sim++) {
        const blackChefs = Array.from({ length: 20 }, (_, i) =>
          createMockChef(`b${i}-${sim}`, "BLACK"),
        );
        const whiteChefs = Array.from({ length: 20 }, (_, i) =>
          createMockChef(`w${i}-${sim}`, "WHITE"),
        );

        const matches = createRound2Matches(blackChefs, whiteChefs);

        let blackSurvivors = 20;
        let whiteSurvivors = 20;

        for (const match of matches) {
          const result = judgeMatchLogic(match, blackSurvivors, whiteSurvivors);
          if (result) {
            if (result.winnerId.startsWith("b")) {
              whiteSurvivors--;
            } else {
              blackSurvivors--;
            }
          }
        }

        if (blackSurvivors >= 9 && whiteSurvivors >= 9) {
          bothTeamsAbove9++;
        }
      }

      console.log(
        `[Result] 9명 이상 생존 성공률: ${bothTeamsAbove9}/${simulations} (${((bothTeamsAbove9 / simulations) * 100).toFixed(0)}%)`,
      );

      // 부스트가 강력해졌으므로 성공률이 높아야 함 (90% 이상 기대)
      expect(bothTeamsAbove9).toBeGreaterThanOrEqual(simulations * 0.9);
    });
  });
});

// 테스트용 매치 생성 헬퍼
function createTestMatch(blackScore: number, whiteScore: number): Match {
  return {
    id: "test-match",
    blackChefId: "b1",
    whiteChefId: "w1",
    mainIngredient: "Test",
    blackDish: {
      id: "b-dish",
      chefId: "b1",
      name: "B",
      description: "",
      tags: [],
      scores: {
        taste: blackScore,
        completeness: blackScore,
        creativity: blackScore,
      },
    } as any,
    whiteDish: {
      id: "w-dish",
      chefId: "w1",
      name: "W",
      description: "",
      tags: [],
      scores: {
        taste: whiteScore,
        completeness: whiteScore,
        creativity: whiteScore,
      },
    } as any,
    votes: [],
    isTie: false,
    status: "ready",
  };
}
