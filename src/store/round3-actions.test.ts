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
        createMockRound({ roundNumber: 1, status: "completed" }),
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
      // Mock playRound3MatchAction
      // The original line was: const result = playRound3MatchAction([], {} as any, -1);
      // The user provided a syntactically incorrect line.
      // Assuming the intent was to mock and then assert, but the mockReturnValue part is not directly usable here.
      // Reverting to the original test logic for correctness, as the provided change was malformed.
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
        judges: generateJudges(10), // This test uses 10, logic handles it
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

    it("매치 0 (1차전) 완료 후 다음 심사위원은 20명이어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 0,
        judges: generateJudges(100),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 0);
      expect(result?.nextJudges).toHaveLength(20);
    });

    it("매치 1 (2차전)의 점수 가중치는 5점이고, 다음 심사위원은 10명이어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const judges = generateJudges(20); // 2차전은 20명으로 시작
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 1,
        judges: judges,
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 1);

      // 점수 검증 (총점 = 20명 * 5점 = 100점)
      const blackScore = result?.roundBlackScore ?? 0;
      const whiteScore = result?.roundWhiteScore ?? 0;
      expect(blackScore + whiteScore).toBe(100);

      // 다음 심사위원 검증
      expect(result?.nextJudges).toHaveLength(10);
    });

    it("매치 2 (3차전)의 점수 가중치는 10점이어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const judges = generateJudges(10); // 3차전은 10명으로 시작
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 2,
        judges: judges,
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 2);

      // 점수 검증 (총점 = 10명 * 10점 = 100점)
      const blackScore = result?.roundBlackScore ?? 0;
      const whiteScore = result?.roundWhiteScore ?? 0;

      console.log(
        `\n[Match 3 (10인)] 흑수저: ${blackScore}점 (${result?.blackVotes}표) vs 백수저: ${whiteScore}점 (${result?.whiteVotes}표)`,
      );

      expect(blackScore + whiteScore).toBe(100);
    });

    it("매치 0 (1차전)에서 최소 20표가 보장되어야 한다", () => {
      // 압도적인 스탯 차이 생성 (백수저가 압승하도록)
      const chefs = [
        createMockChef("b1", "BLACK", {
          stats: {
            taste: 1,
            creativity: 1,
            proficiency: 1,
            mental: 1,
            speed: 1,
          },
          revealedStats: [],
        }),
        createMockChef("w1", "WHITE", {
          stats: {
            taste: 100,
            creativity: 100,
            proficiency: 100,
            mental: 100,
            speed: 100,
          },
          revealedStats: [],
        }),
      ];

      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 0,
        judges: generateJudges(100),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 0);

      console.log(
        `\n[Match 1 (100인)] 흑수저: ${result?.roundBlackScore}점 (${result?.blackVotes}표) vs 백수저: ${result?.roundWhiteScore}점 (${result?.whiteVotes}표)`,
      );

      // Mercy Rule 적용 확인
      expect(result?.blackVotes).toBeGreaterThanOrEqual(20);
      expect(result?.whiteVotes).toBeLessThanOrEqual(80);
    });

    it("매치 1 (2차전)에서 최소 6표가 보장되어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK", {
          stats: {
            taste: 1,
            creativity: 1,
            proficiency: 1,
            mental: 1,
            speed: 1,
          },
          revealedStats: [],
        }),
        createMockChef("w1", "WHITE", {
          stats: {
            taste: 100,
            creativity: 100,
            proficiency: 100,
            mental: 100,
            speed: 100,
          },
          revealedStats: [],
        }),
      ];

      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 1,
        judges: generateJudges(20),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 1);

      console.log(
        `\n[Match 2 (20인)] 흑수저: ${result?.roundBlackScore}점 (${result?.blackVotes}표) vs 백수저: ${result?.roundWhiteScore}점 (${result?.whiteVotes}표)`,
      );

      expect(result?.blackVotes).toBeGreaterThanOrEqual(6);
      expect(result?.whiteVotes).toBeLessThanOrEqual(14);
    });

    it("매치 2 (3차전)에서 최소 2표(20점)가 보장되어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK", {
          stats: {
            taste: 1,
            creativity: 1,
            proficiency: 1,
            mental: 1,
            speed: 1,
          },
          revealedStats: [],
        }),
        createMockChef("w1", "WHITE", {
          stats: {
            taste: 100,
            creativity: 100,
            proficiency: 100,
            mental: 100,
            speed: 100,
          },
          revealedStats: [],
        }),
      ];

      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 2,
        judges: generateJudges(10), // 3차전은 10명
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 2);

      console.log(
        `\n[Match 3 (10인) Mercy Rule Check] 흑: ${result?.roundBlackScore}점 (${result?.blackVotes}표)`,
      );

      // 최소 2표 (20점) 보장
      expect(result?.blackVotes).toBeGreaterThanOrEqual(2);
      expect((result?.blackVotes ?? 0) * 10).toBeGreaterThanOrEqual(20);
      expect(result?.whiteVotes).toBeLessThanOrEqual(8);
    });

    it("다음 라운드 진출 심사위원은 흑/백 투표자 5:5 비율이어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];
      const round3State: Round3State = {
        matches: [],
        currentMatchIndex: 0,
        judges: generateJudges(100),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      const result = playRound3MatchAction(chefs, round3State, 0);

      // 다음 라운드 진출자는 20명
      expect(result?.nextJudges).toHaveLength(20);

      // 이전 투표 결과 확인 (voteHistory의 마지막 항목)
      const nextJudges = result?.nextJudges || [];
      const blackVoters = nextJudges.filter(
        (j) => j.voteHistory[j.voteHistory.length - 1].pick === "BLACK",
      );
      const whiteVoters = nextJudges.filter(
        (j) => j.voteHistory[j.voteHistory.length - 1].pick === "WHITE",
      );

      expect(blackVoters).toHaveLength(10);
      expect(whiteVoters).toHaveLength(10);
    });

    it("Round 3 전체 흐름 시뮬레이션: 점수가 누적되어 최종 승자가 결정되어야 한다", () => {
      const chefs = [
        createMockChef("b1", "BLACK"),
        createMockChef("w1", "WHITE"),
      ];

      // 초기 상태
      let currentState: Round3State = {
        matches: [],
        currentMatchIndex: 0,
        judges: generateJudges(100),
        blackTeamScore: 0,
        whiteTeamScore: 0,
        userPrediction: null,
      };

      let totalBlackScore = 0;
      let totalWhiteScore = 0;

      // Match 1
      const res1 = playRound3MatchAction(chefs, currentState, 0);
      expect(res1).not.toBeNull();
      totalBlackScore += res1!.roundBlackScore;
      totalWhiteScore += res1!.roundWhiteScore;
      currentState = {
        ...currentState,
        judges: res1!.nextJudges,
        currentMatchIndex: 1,
        blackTeamScore: totalBlackScore,
        whiteTeamScore: totalWhiteScore,
      };

      console.log(
        `\n[Simulation Match 1] 흑: ${res1?.roundBlackScore} (누적: ${totalBlackScore}) vs 백: ${res1?.roundWhiteScore} (누적: ${totalWhiteScore})`,
      );

      // Match 2
      const res2 = playRound3MatchAction(chefs, currentState, 1);
      expect(res2).not.toBeNull();
      totalBlackScore += res2!.roundBlackScore;
      totalWhiteScore += res2!.roundWhiteScore;
      currentState = {
        ...currentState,
        judges: res2!.nextJudges,
        currentMatchIndex: 2,
        blackTeamScore: totalBlackScore,
        whiteTeamScore: totalWhiteScore,
      };

      console.log(
        `[Simulation Match 2] 흑: ${res2?.roundBlackScore} (누적: ${totalBlackScore}) vs 백: ${res2?.roundWhiteScore} (누적: ${totalWhiteScore})`,
      );

      // Match 3
      const res3 = playRound3MatchAction(chefs, currentState, 2);
      expect(res3).not.toBeNull();
      totalBlackScore += res3!.roundBlackScore;
      totalWhiteScore += res3!.roundWhiteScore;

      console.log(
        `[Simulation Match 3] 흑: ${res3?.roundBlackScore} (누적: ${totalBlackScore}) vs 백: ${res3?.roundWhiteScore} (누적: ${totalWhiteScore})`,
      );
      console.log(
        `[Final Result] 최종 흑수저: ${totalBlackScore}점 vs 최종 백수저: ${totalWhiteScore}점`,
      );

      expect(totalBlackScore + totalWhiteScore).toBe(300); // 100 + 100 + 100

      const winner = totalBlackScore >= totalWhiteScore ? "BLACK" : "WHITE";
      console.log(
        `🏆 최종 승자: ${winner === "BLACK" ? "흑수저 팀" : "백수저 팀"}`,
      );
    });
  });
});
