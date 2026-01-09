export interface DishScores {
  taste: number; // 맛 점수
  creativity: number; // 창의성 점수
  completeness: number; // 완성도 점수
}

export interface Dish {
  id: string;
  chefId: string;
  name: string;
  description: string;
  scores: DishScores;
  tags: string[]; // "덜 익음", "완벽한 간" 등
}

export type JudgeType = "P" | "A";

export interface Vote {
  judge: JudgeType;
  pick: string; // Chef ID
  comment: string;
}

export interface Match {
  id: string;
  blackChefId: string;
  whiteChefId: string;
  blackDish?: Dish;
  whiteDish?: Dish;
  mainIngredient?: string; // 주재료 (Round 2)
  votes: Vote[]; // 심사위원 투표
  winnerId?: string; // 승자 ID
  loserId?: string; // 패자 ID
  isTie: boolean; // 보류 상태 (1:1)
  status: "ready" | "cooking" | "judging" | "completed";
}
