export type ChefRank = "BLACK" | "WHITE";

export interface ChefStats {
  proficiency: number; // 숙련도
  creativity: number; // 창의력
  taste: number; // 미각
  mental: number; // 멘탈
  speed: number; // 속도 (5th stat)
}

export interface Chef {
  id: string;
  name: string; // Black: Nickname, White: Real name
  rank: ChefRank;
  stats: ChefStats;
  image?: string;
  bio?: string;
}
