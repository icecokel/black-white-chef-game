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
  currentRound: Round | null
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
  name: string
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
  preferences: Judge["preferences"]
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
  matchIndex: number
): Round3MatchResult | null => {
  if (matchIndex < 0 || matchIndex > 2) return null;

  const blackTeam = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive"
  );
  const whiteTeam = chefs.filter(
    (c) => c.rank === "WHITE" && c.status === "alive"
  );

  const blackTeamChef = createTeamChef(blackTeam, "team-black", "흑수저 팀");
  const whiteTeamChef = createTeamChef(whiteTeam, "team-white", "백수저 팀");

  const mainIngredient = MAIN_INGREDIENTS[matchIndex].name;
  const blackDish = generateDish(blackTeamChef, mainIngredient);
  const whiteDish = generateDish(whiteTeamChef, mainIngredient);

  const judges = round3State.judges;
  let blackVotes = 0;
  let whiteVotes = 0;

  const updatedJudges = judges.map((judge) => {
    const blackScore = calcJudgeScore(blackDish, judge.preferences);
    const whiteScore = calcJudgeScore(whiteDish, judge.preferences);

    const pick =
      blackScore >= whiteScore ? ("BLACK" as const) : ("WHITE" as const);
    if (pick === "BLACK") blackVotes++;
    else whiteVotes++;

    return {
      ...judge,
      voteHistory: [...judge.voteHistory, { matchIndex, pick }],
    };
  });

  // 점수 가중치
  let scoreWeight = 1;
  if (matchIndex === 1) scoreWeight = 2;
  if (matchIndex === 2) scoreWeight = 10;

  const roundBlackScore = blackVotes * scoreWeight;
  const roundWhiteScore = whiteVotes * scoreWeight;

  // 다음 라운드 심사위원 선발
  let nextJudges = updatedJudges;
  if (matchIndex < 2) {
    const nextCount = matchIndex === 0 ? 50 : 10;
    const halfCount = nextCount / 2;

    const winnerPick = roundBlackScore >= roundWhiteScore ? "BLACK" : "WHITE";

    const winnerVoters = updatedJudges.filter((j) => {
      const lastVote = j.voteHistory[j.voteHistory.length - 1];
      return lastVote.pick === winnerPick;
    });
    const loserVoters = updatedJudges.filter((j) => {
      const lastVote = j.voteHistory[j.voteHistory.length - 1];
      return lastVote.pick !== winnerPick;
    });

    const selectedWinnerVoters = winnerVoters
      .sort(() => Math.random() - 0.5)
      .slice(0, halfCount);
    const selectedLoserVoters = loserVoters
      .sort(() => Math.random() - 0.5)
      .slice(0, halfCount);

    nextJudges = [...selectedWinnerVoters, ...selectedLoserVoters];
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
