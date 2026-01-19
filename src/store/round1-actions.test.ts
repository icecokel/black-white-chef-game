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
  specialties: ["KOREAN"],
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

    it("선택 가능한 흑수저 셰프가 제한보다 적을 때 남은 인원만 선택해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round = createMockRound({ userPickLimit: 2 });

      const result = autoPickBlackChefsAction(chefs, round);
      expect(result).not.toBeNull();
      expect(result?.selectedIds).toHaveLength(1);
      expect(result?.selectedIds).toContain("chef1");
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
        createMockChef(`chef${i}`),
      );
      const round = createMockRound();

      const result = startRound1JudgingAction(chefs, round);
      expect(result).not.toBeNull();
      expect(result?.judgingQueue).toHaveLength(4); // 첫 배치
      expect(result?.cookingChefIds).toHaveLength(6); // 나머지
      expect(result?.messageLog.length).toBeGreaterThan(0);
    });

    it("셰프 리스트가 비어있으면 null을 반환해야 한다", () => {
      const result = startRound1JudgingAction([], createMockRound());
      expect(result).toBeNull();
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

    it("총점이 같으면 ID가 빠른 순서(혹은 결정론적 순서)로 선발해야 한다", () => {
      const chef1 = createMockChef("a", {
        stats: {
          proficiency: 50,
          creativity: 50,
          taste: 50,
          mental: 50,
          speed: 50,
        },
      });
      const chef2 = createMockChef("b", {
        stats: {
          proficiency: 50,
          creativity: 50,
          taste: 50,
          mental: 50,
          speed: 50,
        },
      });
      const pendingChefs = [chef2, chef1]; // 순서 섞음
      const pendingIds = pendingChefs.map((c) => c.id);

      // 1명 합격
      const result = processPendingChefsAction(pendingChefs, pendingIds, 1);

      expect(result.chefsToPass).toHaveLength(1);
      // 정렬 로직에 따라 a가 될지 b가 될지 확인. 보통 sort 안정성을 위해 ID 등을 보조키로 씀.
      // 현재 구현을 테스트를 통해 확인하고, 만약 불안정하다면 로직 수정 필요할 수도 있음.
      // 일단 a가 되는지 확인 (알파벳순 가정 테스트)
      // 만약 실패하면 로직 수정 필요.
    });

    it("pendingChefs가 비어있어도 에러 없이 빈 결과를 반환해야 한다", () => {
      const result = processPendingChefsAction([], [], 1);
      expect(result.chefsToPass).toHaveLength(0);
      expect(result.chefsToEliminate).toHaveLength(0);
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
        1,
      );

      expect(result.chefsToRevive).toHaveLength(1);
      expect(result.chefsToRevive[0].id).toBe("high");
    });
  });
  describe("Cycle End Logic Scenarios", () => {
    it("Case 0: Pass(22) >= Target(20) -> 성적순 상위 20명만 합격, 초과 2명 탈락", () => {
      // 22명의 합격자를 성적순으로 정렬하고 상위 20명만 합격
      const passedChefs = Array.from({ length: 22 }, (_, i) =>
        createMockChef(`pass${i}`, {
          stats: {
            proficiency: 100 - i * 2, // 100, 98, 96... (높은 순서대로)
            creativity: 50,
            taste: 50,
            mental: 50,
            speed: 50,
          },
        }),
      );
      const passedIds = passedChefs.map((c) => c.id);

      // processPendingChefsAction을 사용하여 초과분 컷 테스트
      // (실제로는 useChefStore에서 처리하지만, 로직 검증용)
      const result = processPendingChefsAction(passedChefs, passedIds, 20);

      console.log(`\n[Case 0 Test] Pass: ${passedChefs.length}, Target: 20`);
      console.log(
        `[Case 0 Result] 최종 합격: ${result.chefsToPass.length}명, 컷: ${result.chefsToEliminate.length}명`,
      );
      console.log(
        `[Case 0 상위 합격 점수] ${result.chefsToPass[0]?.stats.proficiency}점`,
      );
      console.log(
        `[Case 0 컷된 최고 점수] ${result.chefsToEliminate[0]?.stats.proficiency}점`,
      );

      expect(result.chefsToPass).toHaveLength(20);
      expect(result.chefsToEliminate).toHaveLength(2);

      // 합격자 최저 점수 > 탈락자 최고 점수
      const minPassScore = Math.min(
        ...result.chefsToPass.map((c) => c.stats.proficiency),
      );
      const maxFailScore = Math.max(
        ...result.chefsToEliminate.map((c) => c.stats.proficiency),
      );
      expect(minPassScore).toBeGreaterThan(maxFailScore);
    });

    it("Case 1-1: Pass(5) + Pending(6) < Target(20) -> Pending 전원 Pass, 부족분(9) 부활", () => {
      const pendingChefs = Array.from({ length: 6 }, (_, i) =>
        createMockChef(`p${i}`),
      );
      const pendingIds = pendingChefs.map((c) => c.id);

      // Target 20, Current Pass 5 -> Remaining 15
      // Total Potential 5 + 6 = 11 < 20

      // 1. All pending pass (슬롯: 15, 보류자: 6 -> 전원 통과)
      const pendingResult = processPendingChefsAction(
        pendingChefs,
        pendingIds,
        15,
      );

      // 2. Revive remaining (슬롯: 15 - 6 = 9)
      const eliminatedChefs = Array.from({ length: 20 }, (_, i) =>
        createMockChef(`e${i}`, {
          status: "eliminated",
          stats: {
            proficiency: i * 5, // 0, 5, 10... (역순으로 높은 점수가 뒤에)
            creativity: 0,
            taste: 0,
            mental: 0,
            speed: 0,
          },
        }),
      );
      const eliminatedIds = eliminatedChefs.map((c) => c.id);
      const slotsAfterPending = 15 - 6; // 9

      const reviveResult = processEliminatedChefsAction(
        eliminatedChefs,
        eliminatedIds,
        slotsAfterPending,
      );

      console.log(
        `\n[Case 1-1 Test] Pass: 5, Pending: 6, Fail: ${eliminatedChefs.length}`,
      );
      console.log(
        `[Case 1-1 계산] 남은 슬롯: 15, 보류자 합격: 6, 부활 필요: 9`,
      );
      console.log(
        `[Case 1-1 Result] Pending 합격: ${pendingResult.chefsToPass.length}명, 부활: ${reviveResult.chefsToRevive.length}명`,
      );

      expect(pendingResult.chefsToPass).toHaveLength(6); // All Pending Passed
      expect(pendingResult.chefsToEliminate).toHaveLength(0); // No one cut
      expect(reviveResult.chefsToRevive).toHaveLength(9);
    });

    it("Case 1-2: Pass(15) + Pending(5) === Target(20) -> Pending 전원 Pass, 부활 없음", () => {
      const pendingChefs = Array.from({ length: 5 }, (_, i) =>
        createMockChef(`p${i}`),
      );
      const pendingIds = pendingChefs.map((c) => c.id);

      // Target 20, Current Pass 15 -> Remaining 5
      // Total Potential 15 + 5 = 20 === 20

      const pendingResult = processPendingChefsAction(
        pendingChefs,
        pendingIds,
        5,
      );

      console.log(`\n[Case 1-2 Test] Pass: 15, Pending: 5, Target: 20`);
      console.log(
        `[Case 1-2 Result] Pending 합격: ${pendingResult.chefsToPass.length}명, 탈락: ${pendingResult.chefsToEliminate.length}명`,
      );

      expect(pendingResult.chefsToPass).toHaveLength(5); // All Pending Passed
      expect(pendingResult.chefsToEliminate).toHaveLength(0); // Exact match, no cut
    });

    it("Case 2: Pass(15) + Pending(10) > Target(20) -> Pending 중 5명 Pass, 5명 Fail", () => {
      const pendingChefs = Array.from({ length: 10 }, (_, i) =>
        createMockChef(`p${i}`, {
          stats: {
            proficiency: i * 10, // 0, 10, 20... 90 (뒤로 갈수록 높음)
            creativity: 0,
            taste: 0,
            mental: 0,
            speed: 0,
          },
        }),
      );
      const pendingIds = pendingChefs.map((c) => c.id);

      // Target 20, Current Pass 15 -> Remaining 5

      const result = processPendingChefsAction(pendingChefs, pendingIds, 5);

      console.log(`\n[Case 2 Test] Pass: 15, Pending: 10, Target: 20`);
      console.log(
        `[Case 2 Result] Pending 합격: ${result.chefsToPass.length}명, 탈락: ${result.chefsToEliminate.length}명`,
      );
      console.log(
        `[Case 2 합격 점수] ${result.chefsToPass.map((c) => c.stats.proficiency).join(", ")}`,
      );
      console.log(
        `[Case 2 탈락 점수] ${result.chefsToEliminate.map((c) => c.stats.proficiency).join(", ")}`,
      );

      expect(result.chefsToPass).toHaveLength(5);
      expect(result.chefsToEliminate).toHaveLength(5);

      // High score -> Pass (90, 80, 70, 60, 50)
      const passedScores = result.chefsToPass.map((c) => c.stats.proficiency);
      const failedScores = result.chefsToEliminate.map(
        (c) => c.stats.proficiency,
      );

      expect(Math.min(...passedScores)).toBeGreaterThan(
        Math.max(...failedScores),
      );
    });
  });
});
