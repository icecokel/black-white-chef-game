import { describe, it, expect } from "vitest";
import { generateChef, generateAllChefs } from "./chef-generator";

describe("chef-generator", () => {
  describe("generateChef", () => {
    it("흑수저 쉐프를 올바르게 생성해야 한다", () => {
      const chef = generateChef("BLACK");

      expect(chef.id).toBeDefined();
      expect(chef.name).toBeDefined();
      expect(chef.nickname).toBeDefined();
      expect(chef.rank).toBe("BLACK");
      expect(chef.status).toBe("alive");
      expect(chef.cuisine).toBeDefined();
      expect(chef.specialty).toBeDefined();
    });

    it("백수저 쉐프를 올바르게 생성해야 한다", () => {
      const chef = generateChef("WHITE");

      expect(chef.rank).toBe("WHITE");
      expect(chef.status).toBe("alive");
    });

    it("스탯이 1~100 범위 내에 있어야 한다", () => {
      const chef = generateChef("BLACK");

      const stats = [
        chef.stats.proficiency,
        chef.stats.creativity,
        chef.stats.taste,
        chef.stats.mental,
        chef.stats.speed,
      ];

      stats.forEach((stat) => {
        expect(stat).toBeGreaterThanOrEqual(1);
        expect(stat).toBeLessThanOrEqual(100);
      });
    });

    it("흑수저는 revealedStats가 1개여야 한다", () => {
      const chef = generateChef("BLACK");
      expect(chef.revealedStats).toHaveLength(1);
    });

    it("백수저는 revealedStats가 5개(전체)여야 한다", () => {
      const chef = generateChef("WHITE");
      expect(chef.revealedStats).toHaveLength(5);
      expect(chef.revealedStats).toContain("proficiency");
      expect(chef.revealedStats).toContain("creativity");
      expect(chef.revealedStats).toContain("taste");
      expect(chef.revealedStats).toContain("mental");
      expect(chef.revealedStats).toContain("speed");
    });
  });

  describe("generateAllChefs", () => {
    it("100명의 쉐프를 생성해야 한다", () => {
      const chefs = generateAllChefs();
      expect(chefs).toHaveLength(100);
    });

    it("흑수저 80명, 백수저 20명이어야 한다", () => {
      const chefs = generateAllChefs();
      const blackChefs = chefs.filter((c) => c.rank === "BLACK");
      const whiteChefs = chefs.filter((c) => c.rank === "WHITE");

      expect(blackChefs).toHaveLength(80);
      expect(whiteChefs).toHaveLength(20);
    });

    it("흑수저가 먼저, 백수저가 나중에 배치되어야 한다", () => {
      const chefs = generateAllChefs();

      // 첫 80명은 흑수저
      for (let i = 0; i < 80; i++) {
        expect(chefs[i].rank).toBe("BLACK");
      }

      // 마지막 20명은 백수저
      for (let i = 80; i < 100; i++) {
        expect(chefs[i].rank).toBe("WHITE");
      }
    });

    it("모든 쉐프가 alive 상태여야 한다", () => {
      const chefs = generateAllChefs();
      chefs.forEach((chef) => {
        expect(chef.status).toBe("alive");
      });
    });
  });
});
