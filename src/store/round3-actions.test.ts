import { describe, it, expect } from "vitest";
import {
  startRound3Action,
  getTeamAvgStat,
  createTeamChef,
  calcJudgeScore,
  playRound3MatchAction,
} from "./round3-actions";
import type { Chef } from "../types/chef";
import type { Round, Round3State } from "../types/round";
import { generateJudges } from "../types/judge";

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
  revealedStats: ["taste", "creativity"],
  cuisine: "KOREAN",
  specialties: ["KOREAN"],
  bio: "테스트용 쉐프",
  status: "alive",
  ...overrides,
});

const createMockRound = (overrides: Partial<Round> = {}): Round => ({
  roundNumber: 1,
  status: "picking",
  cookingChefIds: [],
  judgingQueue: [],
  currentJudgingIndex: 0,
  passedChefIds: [],
  pendingChefIds: [],
  eliminatedChefIds: [],
  targetPassCount: 10,
  userPickLimit: 0,
  cycleComplete: false,
  messageLog: [],
  ...overrides,
});

describe("round3-actions", () => {
  describe("getTeamAvgStat", () => {
    it("팀 평균 스탯을 계산해야 한다", () => {
      const team = [
        createMockChef("c1", "BLACK", {
          stats: {
            proficiency: 80,
            creativity: 70,
            taste: 90,
            mental: 60,
            speed: 50,
          },
        }),
        createMockChef("c2", "BLACK", {
          stats: {
            proficiency: 60,
            creativity: 90,
            taste: 80,
            mental: 80,
            speed: 70,
          },
        }),
      ];

      const avgTaste = getTeamAvgStat(team, "taste");
      expect(avgTaste).toBe(85); // (90 + 80) / 2
    });

    it("빈 팀은 0을 반환해야 한다", () => {
      const avgTaste = getTeamAvgStat([], "taste");
      expect(avgTaste).toBe(0);
    });

    it("null/undefined 팀 입력에 대해서도 안전하게 처리해야 한다 (Empty Array)", () => {
      const avg = getTeamAvgStat([], "taste");
      expect(avg).toBe(0);
    });
  });

  describe("createTeamChef", () => {
    it("팀 쉐프 객체를 생성해야 한다", () => {
      const team = [
        createMockChef("c1", "BLACK", {
          stats: {
            proficiency: 80,
            creativity: 70,
            taste: 90,
            mental: 60,
            speed: 50,
          },
        }),
        createMockChef("c2", "BLACK", {
          stats: {
            proficiency: 60,
            creativity: 90,
            taste: 80,
            mental: 80,
            speed: 70,
          },
        }),
      ];

      const teamChef = createTeamChef(team, "team-black", "흑수저 팀");

      expect(teamChef.id).toBe("team-black");
      expect(teamChef.nickname).toBe("흑수저 팀");
      expect(teamChef.stats.taste).toBe(85);
    });
  });

  describe("calcJudgeScore", () => {
    it("요리 점수를 계산해야 한다", () => {
      const dish = {
        scores: { taste: 80, creativity: 70, completeness: 90 },
      };
      const preferences = { taste: 50, creativity: 50, completeness: 50 };

      const score = calcJudgeScore(dish, preferences);
      expect(score).toBeGreaterThan(0);
    });
  });

  describe("startRound3Action", () => {
    it("라운드 2 완료 상태가 아니면 null을 반환해야 한다", () => {
      const chefs = [createMockChef("chef1")];
      const round: Round = {
        roundNumber: 2,
        status: "cooking", // 완료가 아님
        cookingChefIds: [],
        judgingQueue: [],
        currentJudgingIndex: 0,
        passedChefIds: [],
        pendingChefIds: [],
        eliminatedChefIds: [],
        targetPassCount: 10,
        userPickLimit: 0,
        cycleComplete: false,
        messageLog: [],
      };

      const result = startRound3Action(chefs, round);
      expect(result).toBeNull();
    });

    it("Round 2가 완료되었지만 Round Number가 2가 아니면 null을 반환해야 한다", () => {
      const result = startRound3Action(
        [],
        createMockRound({ roundNumber: 1, status: "completed" })
      );
      expect(result).toBeNull();
    });

    it("라운드 2 완료 시 라운드 3을 생성해야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const round: Round = {
        roundNumber: 2,
        status: "completed",
        cookingChefIds: [],
        judgingQueue: [],
        currentJudgingIndex: 0,
        passedChefIds: [],
        pendingChefIds: [],
        eliminatedChefIds: [],
        targetPassCount: 10,
        userPickLimit: 0,
        cycleComplete: false,
        messageLog: [],
      };

      const result = startRound3Action(chefs, round);
      expect(result).not.toBeNull();
      expect(result?.newRound.roundNumber).toBe(3);
      expect(result?.newRound.round3State?.judges).toHaveLength(100);
    });
  });

  describe("playRound3MatchAction", () => {
    it("매치 인덱스가 2를 초과하면 null을 반환해야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 3,
        judges: generateJudges(10),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 3);
      expect(result).toBeNull();
    });

    it("존재하지 않는 매치 인덱스(음수)에 접근하면 null을 반환해야 한다", () => {
      // 추가
      const result = playRound3MatchAction([], {} as any, -1);
      expect(result).toBeNull(); // 현재 로직상 > 2 체크만 있어서 음수는 통과할수도? 로직 확인 필요. -> 로직이 if (matchIndex > 2) 만 있음. 음수 체크 없음. 추가 필요할수도. 일단 테스트 돌려서 확인.
    });

    it("유효한 매치는 결과를 반환해야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 0,
        judges: generateJudges(10),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 0);
      expect(result).not.toBeNull();
      expect(result?.blackDish).toBeDefined();
      expect(result?.whiteDish).toBeDefined();
      expect((result?.blackVotes ?? 0) + (result?.whiteVotes ?? 0)).toBe(10);
    });
  });
});
