/**
 * Round 2 관련 액션들을 정의합니다.
 * - 라운드 2 시작 (1:1 매칭)
 * - 매칭 심사
 */
import type { Chef, ChefStats } from "../types/chef";
import type { Round } from "../types/round";
import type { Match } from "../types/match";
import { generateDish, MAIN_INGREDIENTS } from "../utils/dish-generator";

// 스탯 공개 로직: 생존 흑수저에게 스탯 1개 추가 공개
export const revealAdditionalStat = (chef: Chef): Chef => {
  if (chef.rank !== "BLACK" || chef.status !== "alive") return chef;

  const allStats: (keyof ChefStats)[] = [
    "proficiency",
    "creativity",
    "taste",
    "mental",
    "speed",
  ];
  const unrevealed = allStats.filter((s) => !chef.revealedStats.includes(s));

  if (unrevealed.length > 0) {
    const nextStat = unrevealed[Math.floor(Math.random() * unrevealed.length)];
    return { ...chef, revealedStats: [...chef.revealedStats, nextStat] };
  }
  return chef;
};

// 라운드 2 매칭 생성
export const createRound2Matches = (
  aliveBlack: Chef[],
  aliveWhite: Chef[],
): Match[] => {
  const shuffledBlack = [...aliveBlack].sort(() => Math.random() - 0.5);
  const shuffledWhite = [...aliveWhite].sort(() => Math.random() - 0.5);

  const matchCount = Math.min(shuffledBlack.length, shuffledWhite.length);
  const ingredients = [...MAIN_INGREDIENTS]
    .sort(() => Math.random() - 0.5)
    .slice(0, matchCount)
    .map((i) => i.name);

  const matches: Match[] = [];

  for (let i = 0; i < matchCount; i++) {
    const mainIngredient = ingredients[i];
    matches.push({
      id: `match-${i + 1}`,
      blackChefId: shuffledBlack[i].id,
      whiteChefId: shuffledWhite[i].id,
      mainIngredient: mainIngredient,
      blackDish: generateDish(shuffledBlack[i], mainIngredient),
      whiteDish: generateDish(shuffledWhite[i], mainIngredient),
      votes: [],
      isTie: false,
      status: "ready",
    });
  }

  return matches;
};

// 라운드 2 시작 액션
export const startRound2Action = (
  chefs: Chef[],
  currentRound: Round | null,
): { newRound: Round; updatedChefs: Chef[] } | null => {
  if (
    !currentRound ||
    currentRound.roundNumber !== 1 ||
    currentRound.status !== "completed"
  ) {
    return null;
  }

  const aliveBlack = chefs.filter(
    (c) => c.rank === "BLACK" && c.status === "alive",
  );
  const aliveWhite = chefs.filter(
    (c) => c.rank === "WHITE" && c.status === "alive",
  );

  const matches = createRound2Matches(aliveBlack, aliveWhite);

  const newRound: Round = {
    roundNumber: 2,
    status: "picking", // starts with picking phase
    matches: matches,
    round2State: {
      phase: "picking",
      userPicks: [],
      highlightMatches: [],
      currentRevealIndex: 0,
    },
    cookingChefIds: [],
    judgingQueue: [],
    currentJudgingIndex: 0,
    passedChefIds: [],
    pendingChefIds: [],
    eliminatedChefIds: [],
    targetPassCount: 10,
    userPickLimit: 0,
    cycleComplete: false,
    messageLog: [
      "⚔️ 라운드 2: 1vs1 흑백 대전 시작!",
      "승리할 것 같은 쉐프 2명을 선택해주세요.",
    ],
  };

  // 생존 흑수저 스탯 추가 공개
  const updatedChefs = chefs.map((chef) => revealAdditionalStat(chef));

  return { newRound, updatedChefs };
};

// 매칭 심사 결과 계산
export interface JudgeMatchResult {
  votes: { judge: "P" | "A"; pick: string; comment: string }[];
  winnerId: string;
  loserId: string;
  isTie: boolean;
  blackBoost?: number; // 적용된 부스트 (디버깅용)
  whiteBoost?: number;
}

// 부스트 계산: 1~4명(100%), 5명(90%) ... 9명(50%), 10명 이상(0%)
// 공식: min(1.0, 1.4 - survivors * 0.1)
const calculateBoost = (survivors: number): number => {
  if (survivors >= 10) return 0;
  return Math.min(1.0, 1.4 - survivors * 0.1);
};

export const judgeMatchLogic = (
  match: Match,
  blackSurvivors: number = 20, // 기본값: 부스트 없음
  whiteSurvivors: number = 20,
): JudgeMatchResult | null => {
  if (match.status === "completed" || !match.blackDish || !match.whiteDish) {
    return null;
  }

  const { blackDish, whiteDish } = match;

  // 부스트 계산
  const blackBoost = calculateBoost(blackSurvivors);
  const whiteBoost = calculateBoost(whiteSurvivors);

  // Judge P (맛 60%, 완성도 30%, 창의성 10%)
  const rawScoreP_Black =
    blackDish.scores.taste * 0.6 +
    blackDish.scores.completeness * 0.3 +
    blackDish.scores.creativity * 0.1;
  const rawScoreP_White =
    whiteDish.scores.taste * 0.6 +
    whiteDish.scores.completeness * 0.3 +
    whiteDish.scores.creativity * 0.1;

  // 부스트 적용
  const scoreP_Black = rawScoreP_Black * (1 + blackBoost);
  const scoreP_White = rawScoreP_White * (1 + whiteBoost);
  const voteP = scoreP_Black >= scoreP_White ? "black" : "white";

  // Judge A (완성도 50%, 창의성 25%, 맛 25%)
  const rawScoreA_Black =
    blackDish.scores.completeness * 0.5 +
    blackDish.scores.creativity * 0.25 +
    blackDish.scores.taste * 0.25;
  const rawScoreA_White =
    whiteDish.scores.completeness * 0.5 +
    whiteDish.scores.creativity * 0.25 +
    whiteDish.scores.taste * 0.25;

  // 부스트 적용
  const scoreA_Black = rawScoreA_Black * (1 + blackBoost);
  const scoreA_White = rawScoreA_White * (1 + whiteBoost);
  const voteA = scoreA_Black >= scoreA_White ? "black" : "white";

  let winnerId: string;
  let isTie = false;

  const votes = [
    {
      judge: "P" as const,
      pick: voteP === "black" ? match.blackChefId : match.whiteChefId,
      comment: "맛이 중요하쥬.",
    },
    {
      judge: "A" as const,
      pick: voteA === "black" ? match.blackChefId : match.whiteChefId,
      comment: "의도가 잘 보이네요.",
    },
  ];

  if (voteP === voteA) {
    winnerId = voteP === "black" ? match.blackChefId : match.whiteChefId;
  } else {
    isTie = true;
    winnerId = Math.random() < 0.5 ? match.blackChefId : match.whiteChefId;
  }

  const loserId =
    winnerId === match.blackChefId ? match.whiteChefId : match.blackChefId;

  return {
    votes,
    winnerId,
    loserId,
    isTie,
    blackBoost: blackBoost > 0 ? blackBoost : undefined,
    whiteBoost: whiteBoost > 0 ? whiteBoost : undefined,
  };
};
