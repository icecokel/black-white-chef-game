/**
 * Round 3 관련 액션들을 정의합니다.
 * - 라운드 3 시작 (팀전)
 * - 예측 설정
 * - 매치 진행
 */
import type { Chef, ChefStats } from "../types/chef";
import type { Round, Round3State } from "../types/round";
import type { Judge } from "../types/judge";
import { generateJudges } from "../types/judge";
import { generateDish, MAIN_INGREDIENTS } from "../utils/dish-generator";
import { revealAdditionalStat } from "./round2-actions";

// 라운드 3 시작 액션
export const startRound3Action = (
  chefs: Chef[],
  currentRound: Round | null,
): { newRound: Round; updatedChefs: Chef[] } | null => {
  if (
    !currentRound ||
    currentRound.roundNumber !== 2 ||
    currentRound.status !== "completed"
  ) {
    return null;
  }

  const judges = generateJudges(100);

  const round3State: Round3State = {
    matches: [],
    currentMatchIndex: 0,
    judges,
    blackTeamScore: 0,
    whiteTeamScore: 0,
    userPrediction: null,
  };

  const newRound: Round = {
    roundNumber: 3,
    status: "picking",
    round3State,
    cookingChefIds: [],
    judgingQueue: [],
    currentJudgingIndex: 0,
    passedChefIds: [],
    pendingChefIds: [],
    eliminatedChefIds: [],
    targetPassCount: 0,
    userPickLimit: 0,
    cycleComplete: false,
    messageLog: [
      "⚔️ 라운드 3: 흑백 팀전 (재료의 방) 시작!",
      "승리할 것으로 예상되는 팀을 선택해주세요.",
    ],
  };

  // 스탯 추가 공개
  const updatedChefs = chefs.map((chef) => revealAdditionalStat(chef));

  return { newRound, updatedChefs };
};

// 팀 평균 스탯 계산
export const getTeamAvgStat = (team: Chef[], stat: keyof ChefStats): number => {
  if (team.length === 0) return 0;
  return team.reduce((sum, c) => sum + c.stats[stat], 0) / team.length;
};

// 팀 쉐프 객체 생성 (요리 생성용)
export const createTeamChef = (
  team: Chef[],
  id: string,
  name: string,
): Chef => ({
  ...team[0],
  id,
  name,
  nickname: name,
  stats: {
    taste: getTeamAvgStat(team, "taste"),
    creativity: getTeamAvgStat(team, "creativity"),
    proficiency: getTeamAvgStat(team, "proficiency"),
    mental: getTeamAvgStat(team, "mental"),
    speed: getTeamAvgStat(team, "speed"),
  },
});

// 심사위원 점수 계산
export const calcJudgeScore = (
  dish: { scores: { taste: number; creativity: number; completeness: number } },
  preferences: Judge["preferences"],
): number => {
  let score = 0;
  score += dish.scores.taste * (0.4 + (preferences.taste - 50) / 200);
  score += dish.scores.creativity * (0.3 + (preferences.creativity - 50) / 200);
  score +=
    dish.scores.completeness * (0.3 + (preferences.completeness - 50) / 200);
  return score;
};

// 매치 결과
export interface Round3MatchResult {
  blackDish: ReturnType<typeof generateDish>;
  whiteDish: ReturnType<typeof generateDish>;
  mainIngredient: string;
  blackVotes: number;
  whiteVotes: number;
  roundBlackScore: number;
  roundWhiteScore: number;
  updatedJudges: Judge[];
  nextJudges: Judge[];
  winnerId: string;
}

// 매치 진행 로직
export const playRound3MatchAction = (
  chefs: Chef[],
  round3State: Round3State,
  matchIndex: number,
): Round3MatchResult | null => {
  if (matchIndex < 0 || matchIndex > 2) return null;

  const blackTeam = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive",
  );
  const whiteTeam = chefs.filter(
    (c) => c.rank === "WHITE" && c.status === "alive",
  );

  const blackTeamChef = createTeamChef(blackTeam, "team-black", "흑수저 팀");
  const whiteTeamChef = createTeamChef(whiteTeam, "team-white", "백수저 팀");

  const mainIngredient = MAIN_INGREDIENTS[matchIndex].name;
  const blackDish = generateDish(blackTeamChef, mainIngredient);
  const whiteDish = generateDish(whiteTeamChef, mainIngredient);

  // 현재 라운드의 심사위원
  const judges = round3State.judges;

  // 1. 초기 투표 (순수 점수 기반)
  const initialVotes = judges.map((judge) => {
    const blackScore = calcJudgeScore(blackDish, judge.preferences);
    const whiteScore = calcJudgeScore(whiteDish, judge.preferences);

    // 점수 차이 (조정을 위해 저장)
    const diff = Math.abs(blackScore - whiteScore);
    const pick =
      blackScore >= whiteScore ? ("BLACK" as const) : ("WHITE" as const);

    return { judge, pick, diff };
  });

  // 2. 최소 득점 보장 로직 (Mercy Rule)
  let minVotesRequired = 0;
  if (matchIndex === 0) minVotesRequired = 20; // Match 1: 100명 중 20명
  if (matchIndex === 1) minVotesRequired = 6; // Match 2: 20명 중 6명
  if (matchIndex === 2) minVotesRequired = 2; // Match 3: 10명 중 2명 (20점)

  let finalVotes = [...initialVotes];

  if (minVotesRequired > 0) {
    const blackCount = finalVotes.filter((v) => v.pick === "BLACK").length;
    const whiteCount = finalVotes.filter((v) => v.pick === "WHITE").length;

    // 흑 부족
    if (blackCount < minVotesRequired) {
      const needed = minVotesRequired - blackCount;
      // 백 투표자 중 점수 차이가 가장 작은(마음 돌리기 쉬운) 순으로 정렬
      const candidates = finalVotes
        .map((v, idx) => ({ ...v, idx }))
        .filter((v) => v.pick === "WHITE")
        .sort((a, b) => a.diff - b.diff)
        .slice(0, needed);

      candidates.forEach((c) => {
        finalVotes[c.idx].pick = "BLACK";
      });
    }
    // 백 부족
    else if (whiteCount < minVotesRequired) {
      const needed = minVotesRequired - whiteCount;
      // 흑 투표자 중 점수 차이가 가장 작은 순으로 정렬
      const candidates = finalVotes
        .map((v, idx) => ({ ...v, idx }))
        .filter((v) => v.pick === "BLACK")
        .sort((a, b) => a.diff - b.diff)
        .slice(0, needed);

      candidates.forEach((c) => {
        finalVotes[c.idx].pick = "WHITE";
      });
    }
  }

  // 3. 최종 집계 및 심사위원 업데이트
  let blackVotes = 0;
  let whiteVotes = 0;

  const updatedJudges = finalVotes.map((v) => {
    if (v.pick === "BLACK") blackVotes++;
    else whiteVotes++;

    return {
      ...v.judge,
      voteHistory: [...v.judge.voteHistory, { matchIndex, pick: v.pick }],
    };
  });

  // 점수 가중치
  let scoreWeight = 1;
  if (matchIndex === 1) scoreWeight = 5;
  if (matchIndex === 2) scoreWeight = 10;

  const roundBlackScore = blackVotes * scoreWeight;
  const roundWhiteScore = whiteVotes * scoreWeight;

  // 4. 다음 라운드 심사위원 선발 (5:5 강제 비율)
  let nextJudges = updatedJudges;

  if (matchIndex < 2) {
    const nextTotalCount = matchIndex === 0 ? 20 : 10;
    const halfCount = nextTotalCount / 2;

    const blackVoters = updatedJudges.filter((j) => {
      const lastVote = j.voteHistory[j.voteHistory.length - 1];
      return lastVote.pick === "BLACK";
    });
    const whiteVoters = updatedJudges.filter((j) => {
      const lastVote = j.voteHistory[j.voteHistory.length - 1];
      return lastVote.pick === "WHITE";
    });

    // 셔플
    const shuffledBlack = blackVoters.sort(() => Math.random() - 0.5);
    const shuffledWhite = whiteVoters.sort(() => Math.random() - 0.5);

    // 강제 5:5 선발 (최소 보장 로직 덕분에 각 팀 투표자가 halfCount 이상임이 보장됨)
    // 안전장치: 혹시라도 부족하면 상대팀에서 채움 (이론상 발생 안함)
    let nextBatch: Judge[] = [];

    // 흑 50%
    if (shuffledBlack.length >= halfCount) {
      nextBatch.push(...shuffledBlack.slice(0, halfCount));
    } else {
      nextBatch.push(...shuffledBlack);
    }

    // 백 50%
    if (shuffledWhite.length >= halfCount) {
      nextBatch.push(...shuffledWhite.slice(0, halfCount));
    } else {
      nextBatch.push(...shuffledWhite);
    }

    // 모자란 숫자 채우기 (안전장치)
    if (nextBatch.length < nextTotalCount) {
      const remainingIds = new Set(nextBatch.map((j) => j.id));
      const pool = updatedJudges
        .filter((j) => !remainingIds.has(j.id))
        .sort(() => Math.random() - 0.5);
      nextBatch.push(...pool.slice(0, nextTotalCount - nextBatch.length));
    }

    nextJudges = nextBatch;
  }

  return {
    blackDish,
    whiteDish,
    mainIngredient,
    blackVotes,
    whiteVotes,
    roundBlackScore,
    roundWhiteScore,
    updatedJudges,
    nextJudges,
    winnerId: roundBlackScore >= roundWhiteScore ? "team-black" : "team-white",
  };
};
