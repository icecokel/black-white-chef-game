import { describe, it, expect } from "vitest";
import { generateDish, MAIN_INGREDIENTS } from "./dish-generator";
import type { Chef } from "../types/chef";

// 테스트용 목 쉐프 생성
const createMockChef = (overrides: Partial<Chef> = {}): Chef => ({
  id: "test-chef-id",
  name: "테스트 쉐프",
  nickname: "테스트 별명",
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

describe("dish-generator", () => {
  describe("generateDish", () => {
    it("요리를 올바르게 생성해야 한다", () => {
      const chef = createMockChef();
      const dish = generateDish(chef);

      expect(dish.id).toBeDefined();
      expect(dish.chefId).toBe(chef.id);
      expect(dish.name).toBeDefined();
      expect(dish.description).toBeDefined();
      expect(dish.scores).toBeDefined();
      expect(dish.tags).toBeDefined();
    });

    it("요리 점수가 0~100 범위 내에 있어야 한다", () => {
      const chef = createMockChef();
      const dish = generateDish(chef);

      expect(dish.scores.taste).toBeGreaterThanOrEqual(0);
      expect(dish.scores.taste).toBeLessThanOrEqual(100);
      expect(dish.scores.creativity).toBeGreaterThanOrEqual(0);
      expect(dish.scores.creativity).toBeLessThanOrEqual(100);
      expect(dish.scores.completeness).toBeGreaterThanOrEqual(0);
      expect(dish.scores.completeness).toBeLessThanOrEqual(100);
    });

    it("태그가 정확히 3개여야 한다", () => {
      const chef = createMockChef();
      const dish = generateDish(chef);

      expect(dish.tags).toHaveLength(3);
    });

    it("메인 재료가 주어지면 요리 이름에 포함될 수 있어야 한다", () => {
      const chef = createMockChef();
      const ingredient = "트러플";

      // 여러번 생성하여 재료가 포함되는 경우가 있는지 확인
      let found = false;
      for (let i = 0; i < 20; i++) {
        const dish = generateDish(chef, ingredient);
        if (dish.name.includes(ingredient)) {
          found = true;
          break;
        }
      }

      expect(found).toBe(true);
    });

    it("창의력이 높으면 창의성 점수가 보너스를 받을 수 있다", () => {
      const highCreativityChef = createMockChef({
        stats: {
          proficiency: 80,
          creativity: 95, // 매우 높은 창의력
          taste: 85,
          mental: 70,
          speed: 65,
        },
      });

      // 여러번 생성하여 평균 확인
      let totalCreativity = 0;
      const iterations = 50;

      for (let i = 0; i < iterations; i++) {
        const dish = generateDish(highCreativityChef);
        totalCreativity += dish.scores.creativity;
      }

      const avgCreativity = totalCreativity / iterations;
      // 높은 창의력 쉐프는 평균 창의성 점수가 높아야 함
      expect(avgCreativity).toBeGreaterThan(80);
    });
  });

  describe("MAIN_INGREDIENTS", () => {
    it("충분한 수의 재료가 있어야 한다", () => {
      expect(MAIN_INGREDIENTS.length).toBeGreaterThanOrEqual(10);
    });
  });
});
