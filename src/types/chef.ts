export type ChefRank = "BLACK" | "WHITE";

export interface ChefStats {
  proficiency: number; // 숙련도
  creativity: number; // 창의력
  taste: number; // 미각
  mental: number; // 멘탈
  speed: number; // 속도 (5th stat)
}

export type ChefStatus = "alive" | "pending" | "eliminated";

export interface Chef {
  id: string;
  name: string; // 실명 (랜덤 생성)
  nickname: string; // 별명 (랜덤 생성)
  rank: ChefRank;
  stats: ChefStats;
  revealedStats: (keyof ChefStats)[]; // 공개된 스탯 목록
  cuisine: CuisineType;
  specialty: string;
  image?: string;
  bio?: string;
  status: ChefStatus; // 생존 상태
  eliminatedRound?: number; // 탈락한 라운드
  isPlayerPick?: boolean; // 플레이어 예측 여부
}

export type CuisineType =
  | "KOREAN"
  | "CHINESE"
  | "JAPANESE"
  | "WESTERN"
  | "FUSION";
