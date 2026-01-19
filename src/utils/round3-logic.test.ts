import { describe, it, expect } from "vitest";
import { calculateRevealOrder } from "./round3-logic";

describe("calculateRevealOrder", () => {
  // 1. 기본 무결성 검증
  it("should return correct reveal order length and phase count", () => {
    // 30 Black, 70 White
    const votes = [...Array(30).fill("BLACK"), ...Array(70).fill("WHITE")];

    const result = calculateRevealOrder(votes);

    expect(result.revealOrder).toHaveLength(100);
    // Tie count is min(30, 70) = 30. Phase 1 count = 30 * 2 = 60.
    expect(result.phase1Count).toBe(60);
    expect(result.blackCount).toBe(30);
    expect(result.whiteCount).toBe(70);

    // Verify all indices are present and unique
    const indexSet = new Set(result.revealOrder);
    expect(indexSet.size).toBe(100);
    for (let i = 0; i < 100; i++) {
      expect(indexSet.has(i)).toBe(true);
    }
  });

  // 2. 테스트 케이스 1: 동점 구간(Phase 1)의 균형 검증 (Balance)
  it("should maintain 1:1 balance in Phase 1 (Tie Sequence)", () => {
    // 40 Black, 60 White
    const votes = [...Array(40).fill("BLACK"), ...Array(60).fill("WHITE")];

    const { revealOrder, phase1Count } = calculateRevealOrder(votes);

    // Validate logic assumption
    expect(phase1Count).toBe(80); // min(40,60)*2 = 80

    // Check actual votes in Phase 1
    const phase1Indices = revealOrder.slice(0, phase1Count);
    let p1Black = 0;
    let p1White = 0;

    phase1Indices.forEach((idx) => {
      if (votes[idx] === "BLACK") p1Black++;
      if (votes[idx] === "WHITE") p1White++;
    });

    // Should be exactly 1:1 ratio
    expect(p1Black).toBe(40);
    expect(p1White).toBe(40);
  });

  // 3. 테스트 케이스 2: 압도적 차이 시나리오 검증 (Overwhelming)
  it("should handle overwhelming difference correctly", () => {
    // 10 Black, 90 White
    const votes = [...Array(10).fill("BLACK"), ...Array(90).fill("WHITE")];

    const { revealOrder, phase1Count } = calculateRevealOrder(votes);

    expect(phase1Count).toBe(20); // min(10,90)*2 = 20

    // Phase 2 (Burst) should contain ONLY the winner's remaining votes (White)
    // plus any other/null votes if they existed, but here we only have Black/White.
    const phase2Indices = revealOrder.slice(phase1Count);

    // Remaining count = 80
    expect(phase2Indices).toHaveLength(80);

    let p2Black = 0;
    let p2White = 0;

    phase2Indices.forEach((idx) => {
      if (votes[idx] === "BLACK") p2Black++;
      if (votes[idx] === "WHITE") p2White++;
    });

    // Phase 2 must strictly contain ONLY White votes in this scenario
    // because all Black votes were exhausted in Phase 1.
    expect(p2Black).toBe(0);
    expect(p2White).toBe(80);
  });

  // 4. 테스트 케이스 3: 완전 동점 및 랜덤성 검증 (Randomness)
  it("should handle exact tie and produce random order", () => {
    // 50 Black, 50 White
    const votes = [...Array(50).fill("BLACK"), ...Array(50).fill("WHITE")];

    const result1 = calculateRevealOrder(votes);
    const result2 = calculateRevealOrder(votes);

    // Tie Case
    expect(result1.phase1Count).toBe(100);
    expect(result2.phase1Count).toBe(100);

    // Randomness Check
    // It is statistically extremely improbable for two shuffles of 100 items to be identical.
    expect(result1.revealOrder).not.toEqual(result2.revealOrder);
  });
});
