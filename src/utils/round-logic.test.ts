import { describe, it, expect } from "vitest";
import {
  calculatePassRate,
  calculateTotalStats,
  judgeChef,
  createSpeedWeightedQueue,
  sortByTotalStats,
  sortChefList,
} from "./round-logic";
import type { Chef } from "../types/chef";

// 테스트용 목 쉐프 생성
const createMockChef = (
  id: string,
  stats: Partial<Chef["stats"]> = {},
  overrides: Partial<Chef> = {}
): Chef => ({
  id,
  name: "테스트 쉐프",
  nickname: "테스트 별명",
  rank: "BLACK",
  stats: {
    proficiency: 80,
    creativity: 75,
    taste: 85,
    mental: 70,
    speed: 65,
    ...stats,
  },
  revealedStats: ["taste"],
  cuisine: "KOREAN",
  specialties: ["KOREAN"],
  bio: "테스트용 쉐프",
  status: "alive",
  ...overrides,
});

describe("round-logic", () => {
  describe("calculateTotalStats", () => {
    it("모든 스탯의 합계를 계산해야 한다", () => {
      const chef = createMockChef("test-1", {
        proficiency: 80,
        creativity: 75,
        taste: 85,
        mental: 70,
        speed: 65,
      });

      const total = calculateTotalStats(chef);
      expect(total).toBe(80 + 75 + 85 + 70 + 65); // 375
    });
  });

  describe("calculatePassRate", () => {
    it("총점이 500이면 합격률이 50%여야 한다", () => {
      const perfectChef = createMockChef("perfect", {
        proficiency: 100,
        creativity: 100,
        taste: 100,
        mental: 100,
        speed: 100,
      });

      const passRate = calculatePassRate(perfectChef);
      expect(passRate).toBe(50);
    });

    it("총점이 250이면 합격률이 25%여야 한다", () => {
      const midChef = createMockChef("mid", {
        proficiency: 50,
        creativity: 50,
        taste: 50,
        mental: 50,
        speed: 50,
      });

      const passRate = calculatePassRate(midChef);
      expect(passRate).toBe(25);
    });

    it("모든 스탯이 0이면 합격률은 0이어야 한다", () => {
      const chef = createMockChef("zero", {
        proficiency: 0,
        creativity: 0,
        taste: 0,
        mental: 0,
        speed: 0,
      });
      expect(calculatePassRate(chef)).toBe(0);
    });

    it("모든 스탯이 100이면 합격률은 50이어야 한다 (최대 점수)", () => {
      const chef = createMockChef("max", {
        proficiency: 100,
        creativity: 100,
        taste: 100,
        mental: 100,
        speed: 100,
      });
      expect(calculatePassRate(chef)).toBe(50);
    });
  });

  describe("judgeChef", () => {
    it("pass, pending, fail 중 하나를 반환해야 한다", () => {
      const chef = createMockChef("test-judge");

      const result = judgeChef(chef);
      expect(["pass", "pending", "fail"]).toContain(result);
    });

    it("여러번 실행하면 다양한 결과가 나와야 한다", () => {
      const chef = createMockChef("test-variety");
      const results = new Set<string>();

      for (let i = 0; i < 100; i++) {
        results.add(judgeChef(chef));
      }

      // 100번 실행하면 최소 2가지 이상의 결과가 나와야 함
      expect(results.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe("createSpeedWeightedQueue", () => {
    it("쉐프 ID 배열을 반환해야 한다", () => {
      const chefs = [
        createMockChef("fast", { speed: 90 }),
        createMockChef("slow", { speed: 50 }),
        createMockChef("medium", { speed: 70 }),
      ];

      const queue = createSpeedWeightedQueue(chefs);

      expect(queue).toHaveLength(3);
      expect(queue).toContain("fast");
      expect(queue).toContain("slow");
      expect(queue).toContain("medium");
    });

    it("속도가 빠른 쉐프가 앞쪽에 올 확률이 높아야 한다", () => {
      const fastChef = createMockChef("fast", { speed: 100 });
      const slowChef = createMockChef("slow", { speed: 10 });
      const chefs = [slowChef, fastChef];

      let fastFirst = 0;
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        const queue = createSpeedWeightedQueue(chefs);
        if (queue[0] === "fast") {
          fastFirst++;
        }
      }

      // 빠른 쉐프가 첫 번째인 경우가 70% 이상이어야 함
      expect(fastFirst / iterations).toBeGreaterThan(0.7);
    });
  });

  describe("sortByTotalStats", () => {
    it("총점 기준 내림차순으로 정렬해야 한다", () => {
      const lowStats = createMockChef("low", {
        proficiency: 50,
        creativity: 50,
        taste: 50,
        mental: 50,
        speed: 50,
      });
      const highStats = createMockChef("high", {
        proficiency: 90,
        creativity: 90,
        taste: 90,
        mental: 90,
        speed: 90,
      });
      const midStats = createMockChef("mid", {
        proficiency: 70,
        creativity: 70,
        taste: 70,
        mental: 70,
        speed: 70,
      });

      const sorted = sortByTotalStats([lowStats, highStats, midStats]);

      expect(sorted[0].id).toBe("high");
      expect(sorted[1].id).toBe("mid");
      expect(sorted[2].id).toBe("low");
    });
  });

  describe("sortChefList", () => {
    it("상태별로 정렬해야 한다 (alive → pending → eliminated)", () => {
      const alive = createMockChef("alive", {}, { status: "alive" });
      const pending = createMockChef("pending", {}, { status: "pending" });
      const eliminated = createMockChef(
        "eliminated",
        {},
        { status: "eliminated" }
      );

      const sorted = sortChefList([eliminated, alive, pending]);

      expect(sorted[0].status).toBe("alive");
      expect(sorted[1].status).toBe("pending");
      expect(sorted[2].status).toBe("eliminated");
    });

    it("같은 상태 내에서 BLACK이 WHITE보다 앞에 와야 한다", () => {
      const blackAlive = createMockChef(
        "black",
        {},
        { status: "alive", rank: "BLACK" }
      );
      const whiteAlive = createMockChef(
        "white",
        {},
        { status: "alive", rank: "WHITE" }
      );

      const sorted = sortChefList([whiteAlive, blackAlive]);

      expect(sorted[0].rank).toBe("BLACK");
      expect(sorted[1].rank).toBe("WHITE");
    });
  });
});
